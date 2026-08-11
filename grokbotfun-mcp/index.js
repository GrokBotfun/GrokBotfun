#!/usr/bin/env node
// MCP server: deploy tokens on pump.fun.
// Wallet key comes from PUMPFUN_PRIVATE_KEY (base58) — use a dedicated hot wallet
// with only the SOL you are willing to spend.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'
// The ESM build of @pump-fun/agent-payments-sdk (pump-sdk's dependency) ships broken
// `export {a: b}` syntax; the CJS build is fine, so load the SDK through require().
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { OnlinePumpSdk, PumpSdk } = require('@pump-fun/pump-sdk')
import BN from 'bn.js'
import bs58 from 'bs58'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'

function loadWallet() {
  const key = process.env.PUMPFUN_PRIVATE_KEY
  if (!key) throw new Error('PUMPFUN_PRIVATE_KEY is not set (base58 secret key of the deploy wallet)')
  return Keypair.fromSecretKey(bs58.decode(key.trim()))
}

// Tokens received for `sol` SOL on a fresh curve (virtual reserves 1.073B tokens / 30 SOL),
// same math as the bundler's calculate-tokens-to-buy.
function tokensForSol(sol, virtualTokens = 1_073_000_000, virtualSol = 30) {
  return virtualTokens - (virtualTokens * virtualSol) / (virtualSol + sol)
}

async function uploadMetadata({ name, symbol, description, imagePath, imageUrl, twitter, telegram, website }) {
  const form = new FormData()
  let imageBytes, filename
  if (imagePath) {
    imageBytes = await readFile(imagePath)
    filename = path.basename(imagePath)
  } else if (imageUrl) {
    const res = await fetch(imageUrl)
    if (!res.ok) throw new Error(`failed to fetch image: HTTP ${res.status}`)
    imageBytes = Buffer.from(await res.arrayBuffer())
    filename = 'token-image' + (path.extname(new URL(imageUrl).pathname) || '.png')
  } else {
    throw new Error('either imagePath or imageUrl is required')
  }
  form.append('file', new Blob([imageBytes]), filename)
  form.append('name', name)
  form.append('symbol', symbol)
  form.append('description', description ?? '')
  if (twitter) form.append('twitter', twitter)
  if (telegram) form.append('telegram', telegram)
  if (website) form.append('website', website)
  form.append('showName', 'true')

  const res = await fetch('https://pump.fun/api/ipfs', { method: 'POST', body: form })
  if (!res.ok) throw new Error(`metadata upload failed: HTTP ${res.status} ${await res.text().catch(() => '')}`)
  const json = await res.json()
  if (!json.metadataUri) throw new Error('metadata upload returned no metadataUri')
  return json.metadataUri
}

async function deployToken(args) {
  const wallet = loadWallet()
  const connection = new Connection(RPC_URL, 'confirmed')
  const mintKeypair = Keypair.generate()

  const metadataUri = await uploadMetadata(args)

  const sdk = new PumpSdk()
  const global = await new OnlinePumpSdk(connection).fetchGlobal()

  const instructions = [
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 250_000 }),
    ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }),
  ]

  const common = {
    mint: mintKeypair.publicKey,
    name: args.name,
    symbol: args.symbol,
    uri: metadataUri,
    creator: wallet.publicKey,
    user: wallet.publicKey,
    mayhemMode: false,
    cashback: false,
  }

  if (args.devBuySol && args.devBuySol > 0) {
    const buyAmount = tokensForSol(args.devBuySol)
    const ixs = await sdk.createV2AndBuyInstructions({
      global,
      ...common,
      amount: new BN(Math.floor(buyAmount * 1e6)),
      // max SOL cost with 50% headroom for slippage + fees, as in the bundler
      solAmount: new BN(Math.floor(args.devBuySol * LAMPORTS_PER_SOL * 1.5)),
    })
    instructions.push(...ixs)
  } else {
    instructions.push(await sdk.createV2Instruction(common))
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
  const message = new TransactionMessage({
    payerKey: wallet.publicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message()
  const tx = new VersionedTransaction(message)
  tx.sign([wallet, mintKeypair])

  const signature = await connection.sendTransaction(tx, { skipPreflight: false, maxRetries: 3 })
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed')

  return {
    mint: mintKeypair.publicKey.toBase58(),
    signature,
    pumpUrl: `https://pump.fun/coin/${mintKeypair.publicKey.toBase58()}`,
    solscanUrl: `https://solscan.io/tx/${signature}`,
    metadataUri,
  }
}

const server = new McpServer({ name: 'pumpfun-deploy', version: '0.1.0' })

server.tool(
  'wallet_info',
  'Show the deploy wallet address and its SOL balance',
  {},
  async () => {
    const wallet = loadWallet()
    const connection = new Connection(RPC_URL, 'confirmed')
    const lamports = await connection.getBalance(wallet.publicKey)
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ address: wallet.publicKey.toBase58(), sol: lamports / LAMPORTS_PER_SOL }, null, 2),
      }],
    }
  },
)

server.tool(
  'deploy_token',
  'Deploy (create) a new token on pump.fun, optionally with an initial dev buy. Returns mint address, tx signature and pump.fun link.',
  {
    name: z.string().min(1).max(32).describe('Token name'),
    symbol: z.string().min(1).max(10).describe('Ticker, e.g. DOGE'),
    description: z.string().max(1000).optional().describe('Token description'),
    imagePath: z.string().optional().describe('Absolute path to a local image file (png/jpg/gif)'),
    imageUrl: z.string().url().optional().describe('URL of the token image (used if imagePath is not given)'),
    twitter: z.string().optional().describe('Twitter/X link'),
    telegram: z.string().optional().describe('Telegram link'),
    website: z.string().optional().describe('Website link'),
    devBuySol: z.number().min(0).max(85).optional().describe('Initial dev buy in SOL (0 or omit for none)'),
  },
  async (args) => {
    const result = await deployToken(args)
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  },
)

const transport = new StdioServerTransport()
await server.connect(transport)
console.error('[grokbotfun] ready, rpc =', RPC_URL)
