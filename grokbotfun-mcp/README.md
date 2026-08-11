# GrokBotfun

**Deploy pump.fun tokens straight from your AI agent.**

An MCP (Model Context Protocol) server that plugs into Grok Bot, Cursor, Claude
Code or any other MCP-compatible client and gives the agent one superpower:
launching tokens on [pump.fun](https://pump.fun). You describe the coin in plain
words — the agent deploys it on-chain.

> "deploy a token called Moon Cat, ticker MCAT, this image, 0.5 SOL dev buy"
>
> → token is live, you get the mint address and a pump.fun link back.

## What it does

| Tool | Description |
| --- | --- |
| `deploy_token` | Creates a coin on pump.fun: uploads metadata (name, ticker, description, image, socials) to pump.fun's IPFS, then builds, signs and sends the `createV2` transaction — with an optional **dev buy in the same transaction**, so you're always the first buyer. Returns mint address, tx signature and pump.fun link. |
| `wallet_info` | Shows your deploy wallet address and SOL balance. |

## Why this instead of the pump.fun website

- **Agent-native.** Your AI can generate the name, ticker, description and image
  itself, then deploy — one conversation, zero tabs.
- **Atomic dev buy.** Create + first buy land in a single transaction — no
  gap for snipers between your create and your buy.
- **Self-custodial.** Your key stays on your machine. The transaction is signed
  locally and sent to your own RPC. No third-party API holds your funds —
  the only external calls are metadata upload to pump.fun IPFS and your RPC.
- **Open source.** ~200 lines, built on the official `@pump-fun/pump-sdk`.
  Read it before you trust it.

## How it works

```
you → agent (Grok Bot / Cursor / Claude Code)
        → MCP: deploy_token(name, symbol, image, devBuySol…)
            1. image + metadata → pump.fun IPFS  → metadataUri
            2. pump-sdk createV2 (+ dev buy)     → transaction
            3. sign with YOUR key, locally
            4. send to YOUR rpc                  → mint address + link
```

## Install

Add to your MCP config (Cursor / Grok Bot: `.cursor/mcp.json` or
*Customize → MCPs*; Claude Code: `claude mcp add`):

```json
{
  "mcpServers": {
    "pumpfun-deploy": {
      "command": "npx",
      "args": ["-y", "grokbotfun"],
      "env": {
        "PUMPFUN_PRIVATE_KEY": "<base58 secret key of your deploy wallet>",
        "SOLANA_RPC_URL": "https://api.mainnet-beta.solana.com"
      }
    }
  }
}
```

Restart the client — `deploy_token` and `wallet_info` show up in the tool list.

| Env var | Required | Description |
| --- | --- | --- |
| `PUMPFUN_PRIVATE_KEY` | yes | Base58 secret key (Phantom export format) of the wallet that signs and pays for deploys. |
| `SOLANA_RPC_URL` | no | Your RPC endpoint. Public mainnet by default; use Helius/QuickNode for serious launches. |

## Security

- **Use a dedicated hot wallet.** Fund it only with what you intend to spend
  (network fees + dev buy). Never your main wallet.
- The key lives in the env of a local process and is used only to sign
  transactions. It is never transmitted anywhere.
- Dev buy is capped at 85 SOL and includes a 50% max-cost headroom for
  slippage — the unspent part stays in your wallet.

## FAQ

**How much does a deploy cost?** Network fees (~0.02 SOL) + pump.fun create fee
+ whatever dev buy you choose. No fee goes to this tool.

**Can it rug / steal the key?** The code is open and short — audit it. The key
never leaves your machine; there is no backend.

**Devnet?** pump.fun is mainnet-only, so every deploy is real. Test with a
throwaway wallet and no dev buy first.

## Links

- X (Twitter): [x.com/GrokBotfun](https://x.com/GrokBotfun)
- GitHub: [GrokBotfun/GrokBotfun](https://github.com/GrokBotfun/GrokBotfun)

## License

MIT
