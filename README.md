# Discord Media Bot: High-Performance Image & GIF Network

A premium, high-speed Discord bot built on **Discord.js v14** for delivering a massive variety of animated and static image content. The system acts as a sophisticated proxy and API aggregator, scraping from multiple high-end CDNs and JSON backends to natively display content in Discord embeds while circumventing traditional security barriers (like hotlinking blocks, DNS poisoning, and Discord Media Proxy rendering failures).

---

## ⚡ Core Architecture

The repository adheres to a strict modular design pattern to ensure scalability across its tens of thousands of scraped entries:
- **/commands**: Hosts the individual slash command modules (e.g., `/gif`, `/help`, `/ping`).
- **/events**: Houses the centralized event listeners (e.g., `interactionCreate.js` for automated interaction deferrals, `messageCreate.js` for `@mention` onboarding).
- **/handler**: Handles automatic global deployment and dynamic command registration.
- **/utils**: Contains robust fetching logic (`api.js`), managing sophisticated 15-cycle retry loops, IP/DNS-level bypass configurations, `arraybuffer` extraction, and styled terminal readouts (`logger.js` via `chalk`).

## 🎯 Key Features

*   **Massive Multi-API Network**: Scrapes from 7+ major backends natively (`Porngifs`, `Sex.com`, `Waifu.im`, `Purrbot`, `Oboobs`, `N-SFW`, etc.). See [APIs.md](./APIs.md) for a complete breakdown of endpoints.
*   **Dynamic Help Directory**: The `/help` command does not rely on hardcoded strings. It organically discovers all active commands via `client.commands` and paginates them. It includes a **Fuzzy-Search Modal** (Levenshtein distance) and intelligent "Smart Back" logic to retain user state.
*   **Native Embed Proxying**: Bypasses Discord's notoriously flawed media proxy by downloading raw binary `arraybuffer` data directly from external CDNs. It enforces an 8MB byte-limit check and attaches the file as a local `AttachmentBuilder`, dynamically masking MIME types to force native inline animation.
*   **Total Randomization (Pool System)**: Commands like `/gif` dynamically route users between completely different backend services on execution, maximizing content entropy.
*   **Advanced Diagnostics**: The `/ping` system offers a two-page UI detailing real-time Websocket Latency, Uptime, Memory Consumption, and Guild distribution.
*   **Zero-Setup Deployment**: The `/invite` command calculates the precise 6-bit permission mask dynamically based on the bot's `CLIENT_ID`, generating a perfect OAuth2 link automatically.

---

## 🛠️ Configuration & Setup

This bot is designed to run in headless cloud environments (e.g., Replit, Heroku, VPS). It requires specific environment variables to function.

### Required Environment Variables (Secrets)
> **Note:** The use of `.env` files is strictly prohibited. You must pass these variables directly into the process environment or via the host's secret manager.

*   `BOT_TOKEN`: The Discord Developer Portal Bot Token.
*   `CLIENT_ID`: The unique Application ID of your bot (required for exact `@mention` tracking and `/invite` generation).
*   `WAIFU_IM_KEY`: The authorization token required to access the `v7` API of `waifu.im`.

### Optional Environment Variables
*   `TESTING_GUILD_ID`: (Optional) Provide a Discord Server ID to register experimental or in-development commands natively mapped to the `testOnly: true` property in command scripts. If this variable is absent, experimental commands will safely skip registration and avoid polluting the global command space.

### Execution
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the application:
   ```bash
   node index.js
   ```

## 🔒 Security & Quality Standards
*   **NSFW Context Management**: The bot globally enforces `setNSFW(true)` constraint checks within Guild channels. However, it natively supports `setIntegrationTypes(0, 1).setContexts(0, 1, 2)` to flawlessly bypass blocks for users in Direct Messages.
*   **Utility Exemption**: Core systems (`/help`, `/ping`, `/invite`, `intro`) are whitelisted from NSFW blocks, allowing technical diagnostics anywhere.
*   **Stateful Buttons**: The UI strictly uses a dynamic `refresh_{commandName}_{option}` CustomID structure. This organically preserves user options across execution loops while preventing "image ghosting" on UI updates.
