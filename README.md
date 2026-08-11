# GrokBotfun

**Deploy pump.fun tokens straight from your AI agent.**

Tell your agent the name and the ticker. It ships your coin on pump.fun and
comes back with the link. Create + dev buy land in one atomic transaction,
signed locally with your own wallet.

## What's in this repo

| Folder | What it is |
| --- | --- |
| [`grokbotfun-mcp/`](grokbotfun-mcp/) | The MCP server itself: `deploy_token` and `wallet_info` tools. Published on npm as `grokbotfun`. |
| [`grokbotfun-plugin/`](grokbotfun-plugin/) | Agent-plugin manifest (agent-plugins.org spec) for the Grok Bot / Cursor plugin marketplace. |

## Quick start

Add to your MCP config (Grok Bot / Cursor: `.cursor/mcp.json`; Claude Code: `claude mcp add`):

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

Restart your client, then just say: *"deploy a token called Moon Cat, ticker MCAT, 0.5 SOL dev buy"*.

Full docs: [grokbotfun-mcp/README.md](grokbotfun-mcp/README.md)

## Security

Self-custodial by design. The key lives in the env of a local process and signs
transactions on your machine. Use a dedicated hot wallet funded only with what
you intend to spend.

## Links

- X (Twitter): [x.com/GrokBotfun](https://x.com/GrokBotfun)
- npm: [grokbotfun](https://www.npmjs.com/package/grokbotfun)

## License

MIT · not affiliated with xAI or pump.fun
