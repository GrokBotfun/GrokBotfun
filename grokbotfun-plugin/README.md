# GrokBotfun

Deploy tokens on [pump.fun](https://pump.fun) straight from your agent.

Tell your agent the name and the ticker. It uploads the metadata, creates the
coin and lands your dev buy in the same atomic transaction, then hands back the
mint address and a pump.fun link.

## Tools

| Tool | Description |
| --- | --- |
| `deploy_token` | Creates a coin on pump.fun: uploads metadata (name, ticker, description, image, socials) to pump.fun IPFS, then builds, signs and sends the `createV2` transaction with an optional dev buy in the same transaction. Returns the mint address, transaction signature and pump.fun link. |
| `wallet_info` | Shows the deploy wallet address and its SOL balance. |

## Install

Open the plugin marketplace in your client (Plugins → Marketplace), find
**GrokBotfun** and press **Add**. The configure dialog then asks for the two
variables below and wires the MCP server up for you.

To install manually instead, add this to your MCP config:

```json
{
  "mcpServers": {
    "grokbotfun": {
      "command": "npx",
      "args": ["-y", "grokbotfun"],
      "env": { "PUMPFUN_PRIVATE_KEY": "<base58 key of a dedicated deploy wallet>" }
    }
  }
}
```

## Setup

On install you are asked for:

- **Deploy wallet private key** (base58, the format Phantom exports). Use a
  dedicated hot wallet funded only with the SOL you intend to spend on launches.
  The key stays on your machine and is used only to sign transactions locally.
- **Solana RPC URL** (optional). Defaults to the public mainnet RPC; a dedicated
  provider is recommended for production launches.

Then just say: *"deploy a token called Moon Cat, ticker MCAT, 0.5 SOL dev buy"*.

## Security

Self-custodial by design. Transactions are signed locally and sent to your own
RPC endpoint. There is no backend and nobody else holds your funds. The only
external calls are the metadata upload to pump.fun IPFS and your RPC.

The dev buy is capped at 85 SOL and its maximum cost includes a slippage
headroom, so the unspent part stays in your wallet.

Source: [github.com/GrokBotfun/GrokBotfun](https://github.com/GrokBotfun/GrokBotfun)

## License

MIT
