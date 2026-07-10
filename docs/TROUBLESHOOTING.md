# Troubleshooting

## Interaction error 40060

`40060: Interaction has already been acknowledged` means Discord received an
initial callback for that interaction before the failing callback arrived.
An interaction may receive only one initial response, and that response must
be sent within three seconds.

The runtime protects this boundary in five ways:

1. The responder locks synchronously before starting its callback request.
2. Callback POSTs do not retry ambiguous transport or 5xx failures. The first
   request may have reached Discord even if its HTTP response was lost.
3. Interaction IDs are retained for 15 minutes in a bounded 10,000-entry cache
   so a replayed Gateway dispatch cannot execute twice in one process.
4. Discord codes `40060`, `10062` (unknown interaction), and `10015` (expired
   interaction webhook) are terminal and never trigger another callback.
5. Every router path and the detached Gateway listener have a final rejection
   boundary, preventing an interaction failure from becoming an unhandled
   promise rejection.

The remaining external cause is two active bot processes or replicas using the
same `BOT_TOKEN`. Both Gateway sessions can receive the interaction, but only
one can acknowledge it. Ensure that a development runner, deployment, old
revision, or second replica is not still running with the same token. Stop the
extra process before restarting the intended deployment.

## Old refresh buttons

Messages created by the archived bot use IDs such as
`refresh_anal_Anime`, while new messages use compact `m:` IDs. The router
accepts both formats, including the archived style, gender, and threesome
state, so refresh buttons on pre-migration messages continue to work.

Buttons from unrelated or removed versions still receive the ephemeral
message `This interaction is no longer available.` This is intentional.

## Unknown interaction 10062

Discord invalidates an interaction token if the initial callback does not
arrive within three seconds. Media commands defer before making any provider
request, so repeated `10062` errors usually indicate host event-loop stalls,
severe network delay to Discord, or multiple competing processes rather than a
slow media API.

## Performance expectations

The raw Discord implementation primarily improves startup time, memory use,
dependency count, and control over acknowledgements. Once a command is
deferred, external provider latency and media download/upload time dominate.

Provider fallback is deliberately sequential. The bot never races several
media APIs for one command, which protects CPU, memory, bandwidth, provider
quotas, and other users. Node's Fetch implementation already pools ordinary
HTTP connections, and media is kept in bounded memory without filesystem or
conversion work.

If production metrics later show sustained load, the safest next additions
are a short provider circuit breaker, a bounded media-work queue, and latency
metrics per provider. Parallel provider racing and unbounded response caching
are not recommended for this workload.
