# GrokBotfun — agent plugin

Deploy tokens on [pump.fun](https://pump.fun) straight from Grok Bot / Cursor.

Tools provided (via the [grokbotfun](https://github.com/GrokBotfun/GrokBotfun) MCP server):

- **deploy_token** — create a coin (name, ticker, description, image, socials) with an
  optional dev buy in the same transaction. Returns mint, tx signature and pump.fun link.
- **wallet_info** — deploy wallet address and SOL balance.

## Setup

On install you'll be asked for:

- **Deploy wallet private key** (base58, Phantom export format) — use a **dedicated**
  hot wallet funded only with the SOL you intend to spend. The key stays on your
  machine and is used only to sign transactions locally.
- **Solana RPC URL** (optional) — defaults to the public mainnet RPC.

Then just tell your agent: *"deploy a token named X, ticker Y, this image, 0.5 SOL dev buy"*.
