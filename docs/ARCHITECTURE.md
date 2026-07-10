# Architecture

## Startup

`index.js` validates configuration and starts `BotApplication`.

1. `command-loader.js` imports every command module and validates its public
   Discord command shape.
2. `command-registration.js` bulk-overwrites the configured global and/or test
   guild command collection.
3. `DiscordGatewayClient` calls `GET /gateway/bot` and opens Gateway v10.
4. After `HELLO`, the client starts randomized heartbeats and sends `IDENTIFY`.
5. Raw `INTERACTION_CREATE` and `MESSAGE_CREATE` dispatches are routed to the
   corresponding brain modules.

There is no manual post-deployment registration command.

## Discord transport

`src/discord/rest-client.js` owns raw HTTP API v10 requests. It serializes calls
per normalized route, reads Discord rate-limit headers, honors `retry_after`
for 429 responses, tracks global limits, retries bounded transient failures,
and does not send the bot token to interaction webhook routes.

`src/discord/gateway-client.js` owns the WebSocket lifecycle. It implements
Gateway JSON payloads directly: heartbeat and ACK handling, sequence tracking,
IDENTIFY, READY state, RESUME, RECONNECT, INVALID_SESSION, exponential
reconnect delay, and fatal close-code handling. No compression is requested,
so binary Gateway payloads are treated as a protocol error.

## Terminal logging

`src/lib/logger.js` provides one shared structured terminal format for every
subsystem. Chalk assigns distinct portable ANSI styles to boot, event,
success, informational, warning, error, and debug records. Child loggers retain
their application/subsystem context, errors keep stack traces, Replit and TTY
color support is detected automatically, and JSON output remains available
for external log collectors.

## Interaction routing

The router handles command, component, autocomplete, and modal interaction
types. Long-running media commands immediately send a deferred callback, then
edit the original interaction response through the webhook endpoint. Refresh
buttons encode only the command option state needed to reproduce a request.

Initial callbacks use at-most-once semantics: the responder locks before the
HTTP request begins and does not retry ambiguous transport or server failures.
A bounded 15-minute interaction-ID cache suppresses replayed Gateway
dispatches. Already-acknowledged and expired interaction codes are treated as
terminal, while legacy `refresh_*` component IDs remain migration-compatible.

Guild media requests pass both Discord's command-level `nsfw` registration and
a runtime channel check. Direct-message contexts preserve the original bot's
behavior.

## Command brain

Each public command has its own file in `src/commands/`. Media command files
explicitly declare their complete source lists and option groups. Shared
execution mechanics—deferral, fallback, embeds, attachments, and refresh
buttons—live in `media-command.js`.

This keeps category ownership visible without copying a large interaction
implementation into every command.

## Provider brain

Each provider has one transport/parser module in `src/brain/providers/`.
Provider calls use bounded timeouts and download limits. A failed provider is
logged and the command tries the next source in its own declared pool.

`manifest.js` records endpoint templates and the complete Sex.com niche list.
`APIs.md` records all active parameters and headers in human-readable form.
`COMMAND_PARITY.md` records the archived command-to-provider audit.

## Files and binary safety

The runtime never writes downloaded media to disk. Buffers are held in memory
only long enough to submit a multipart Discord response. `.gitignore` excludes
media, archives, build output, caches, bytecode, crash files, and executable
artifacts. `.gitattributes` marks source/document formats as text.

`scripts/check.mjs` rejects binary extensions and NUL bytes, checks Git's
numstat for binary changes, verifies every archived file against the original
commit, and prevents high-level Discord wrappers from entering active code.
