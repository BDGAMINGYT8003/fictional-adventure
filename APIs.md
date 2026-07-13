# Active media APIs and exact contracts

This file records every endpoint, query parameter, header, category, and tag
used by the original commands and retained in the rebuilt runtime. Provider
selection is declared in each individual file under `src/commands/`; transport
implementations live under `src/brain/providers/`.

## 1. Purrbot

Method: `GET`. Response field: `link`.

- `https://purrbot.site/api/img/nsfw/anal/gif`
- `https://purrbot.site/api/img/nsfw/blowjob/gif`
- `https://purrbot.site/api/img/nsfw/cum/gif`
- `https://purrbot.site/api/img/nsfw/fuck/gif`
- `https://purrbot.site/api/img/nsfw/neko/gif`
- `https://purrbot.site/api/img/nsfw/neko/img`
- `https://purrbot.site/api/img/nsfw/pussylick/gif`
- `https://purrbot.site/api/img/nsfw/solo/gif`
- `https://purrbot.site/api/img/nsfw/solo_male/gif`
- `https://purrbot.site/api/img/nsfw/threesome_fff/gif`
- `https://purrbot.site/api/img/nsfw/threesome_ffm/gif`
- `https://purrbot.site/api/img/nsfw/threesome_mmf/gif`
- `https://purrbot.site/api/img/nsfw/yuri/gif`

## 2. N-SFW.COM (ABD)

Method: `GET`. The adapter reads only the `url_japan` response field and ignores
every other declared mirror. Media must be downloaded successfully from the
exact Osaka host and is always re-uploaded as a native Discord attachment;
Discord never renders the upstream URL directly inside the embed.

Base: `https://api.n-sfw.com/nsfw/{category}`

Retained categories:

`anal`, `ass`, `blowjob`, `breeding`, `buttplug`, `cages`, `ecchi`, `feet`,
`legs`, `masturbation`, `milf`, `neko`, `paizuri`, `petgirls`, `selfie`,
`smothering`, `socks`, and `yuri`.

The Osaka route is restricted to the exact `n-sfw.ap-osaka-1.s3.ink` hostname,
performs a separate certificate hostname check, and tolerates only Node's
`CERT_HAS_EXPIRED` authorization result. Self-signed certificates, untrusted
chains, hostname mismatches, redirects to undeclared hosts, and every other TLS
error remain blocked. No credentials or Discord tokens are sent to media hosts,
downloads remain size/time bounded, and the Link button points to the validated
Osaka media URL.

## 3. Waifu.im v7

Method: `GET`.

Endpoint: `https://api.waifu.im/images`

Exact query parameters:

- `IncludedTags={tag}`
- `IsNsfw=True`

Exact headers:

- `Authorization: ApiKey ${WAIFU_IM_KEY}`
- `Accept-Version: v7`

Retained tags:

`ass`, `ecchi`, `ero`, `hentai`, `maid`, `milf`, `oppai`, `oral`, `paizuri`,
`selfies`, `uniform`, and `waifu`.

Response path: `items[0].url`.

## 4. Waifu.pics

Method: `GET`. Response field: `url`. Disabled by default, matching the legacy
Replit configuration; enable with `WAIFU_PICS=true`.

- `https://api.waifu.pics/nsfw/blowjob`
- `https://api.waifu.pics/nsfw/neko`
- `https://api.waifu.pics/nsfw/waifu`

## 5. Sex.com GIF search

Method: `GET`.

Endpoint: `https://www.sex.com/portal/api/gifs/search`

Exact query parameters:

- `sexual-orientation=straight`
- `order=likeCount`
- `search={random niche}`
- `page={random integer from 1 through 10}`
- `limit=40`

The exact archived browser header is sent:

`User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36`

A random item is selected from `data`; its `uri` has a terminal `.webp`
changed to `.gif`, then is appended to `https://imagex1.sx.cdn.live`. The link
button uses `https://www.sex.com/pin/{id}/`.

Retained niches:

`Amateur`, `Anal`, `Asian`, `Big Tits`, `Blonde`, `Blowjob`, `Brunette`,
`Creampie`, `Cumshot`, `Hardcore`, `Latina`, `Lesbian`, `MILF`, `Masturbation`,
`Threesome`, `Ass`, `BBW`, `BDSM`, `Double Penetration`, `Ebony`,
`Female Ejaculation`, `Fisting`, `Footjob`, `Gangbang`, `Hairy`, `Handjob`,
`Hentai`, `Lingerie`, `Public Sex`, `Pussy`, and `Toys`.

## 6. Oboobs.ru and Obutts.ru

Method: `GET`.

Oboobs:

- Random: `http://api.oboobs.ru/boobs/0/1/random/`
- By ID: `http://api.oboobs.ru/boobs/get/{id}/`
- Media: `http://media.oboobs.ru/{preview}`

Obutts:

- Random: `http://api.obutts.ru/butts/0/1/random/`
- By ID: `http://api.obutts.ru/butts/get/{id}/`
- Media: `http://media.obutts.ru/{preview}`

The first array item supplies `id` and `preview`. Plain HTTP is retained because
it is part of the original provider contract; no credentials are sent.

## 7. NekoBot.xyz

Method: `GET`.

Endpoint: `https://nekobot.xyz/api/image?type={type}`

Header: `Authorization: ${NEKOBOT_AUTHORIZATION}`.

Retained types:

`4k`, `anal`, `ass`, `blowjob`, `boobs`, `feet`, `gonewild`, `hass`, `hboobs`,
`hentai`, `hentai_anal`, `hkitsune`, `hmidriff`, `hthigh`, `hyuri`, `lewdneko`,
`paizuri`, `pgif`, `pussy`, `tentacle`, and `thigh`.

The response must have `success=true`; media is read from `message`. The old
hard-coded authorization value was not copied into active code. It remains in
the byte-for-byte legacy archive and must now be supplied through the host's
secret manager.

## 8. Nekos API v4

Method: `GET`.

Endpoint template:

`https://api.nekosapi.com/v4/images/random?limit=1&rating=explicit,suggestive&tags={tag}`

Exact parameters:

- `limit=1`
- `rating=explicit,suggestive`
- `tags={tag}`

Retained tags: `anal`, `catgirl`, `maid`, `masturbating`, `pussy`, `threesome`,
and `yuri`. Response path: `[0].url`.

## 9. Porngifs.com

Method: `GET` against media path `https://cdn.porngifs.com/img/{randomId}`.
`randomId` is retained as an integer from 1 through 39,239. Up to 15 IDs are
tried.

The original implementation's DNS/SNI route is retained without disabling
certificate verification:

- Resolve `porngifs.com`.
- Connect to the resolved address using TLS `servername=cdn.porngifs.com`.
- Request `/img/{randomId}`.
- Send `Host: cdn.porngifs.com`.
- Send `Referer: https://porngifs.com/`.
- Send a browser-style `User-Agent` and `Accept: image/*`.
- Accept only bounded payloads larger than 1 KiB and upload them as native
  attachments.

## 10. Porngifs.tv

Method: `GET`.

Endpoint:

`https://porngifs.tv/?action=ajax&mode=async&function=get_block&block_id=list_videos_most_recent_videos&sort_by=post_date&from={randomPage}`

Exact query parameters:

- `action=ajax`
- `mode=async`
- `function=get_block`
- `block_id=list_videos_most_recent_videos`
- `sort_by=post_date`
- `from={random integer from 1 through 2603}`

Headers: `X-Requested-With: XMLHttpRequest` and a browser-style `User-Agent`.
Up to 15 pages are tried. `data-webp` values ending in `.webp` or `.gif` are
collected, one is selected randomly, downloaded within the active attachment
limit, and uploaded using its real content type.

## 11. Cosplay HTML feeds

The `/cosplay` command uses an ordered provider pool. The primary provider is
always attempted first; Ahottie is contacted only after a primary failure.
Neither adapter opens an individual gallery or album page.

### Hentai-cosplay-xxx.com (primary)

Feed template:

`https://hentai-cosplay-xxx.com/search/page/{page}/`

On every command or Refresh execution, the adapter reads the current
pagination ceiling from the feed's `a.last` link, generates a fresh
cryptographically random page from the complete `1..maximum` range, and reads
that feed page. Page 1 is reused when it is the randomly selected page.

Only image/source elements inside `ul#image-list` are considered. The adapter
never requests the `/image/...` gallery links. It removes `/p={width}/` and
`/p={width}x{height}/` path wrappers, resolves protocol-relative CDN URLs,
rejects non-HTTPS and foreign hosts, de-duplicates the resulting raw URLs, and
selects uniformly from the complete candidate array.

### Ahottie.top (fallback)

Feed template:

`https://ahottie.top/tags/Cosplay?page={page}`

The maximum page is read dynamically from the index pagination on every
fallback execution. A fresh page is selected across the complete range. Only
image elements already contained by `/albums/...` links in the index payload
are parsed; the album URLs themselves are never requested. Direct
`imagesN.imgbox.com` URLs are accepted, while Imgbox thumbnail URLs are promoted
from `thumbsN`/`_t` to their `imagesN`/`_o` originals.

Both feeds and media downloads have host allowlists, shutdown-aware timeouts,
and byte ceilings. The selected image is downloaded once, verified as an image,
and uploaded as a native Discord attachment so the embed renders immediately.
The Link button retains the resolved raw media URL. No browser automation,
prefetching, speculative request, or background crawl is used.

## 12. PornPics butt-plug category feed

The Real source for `/buttplug` uses the public category feed at:

`https://www.pornpics.com/butt-plug/`

Each execution selects a cryptographically random item index from `0` through
`999`. For indices `0..19`, the already-rendered category HTML is requested once
and only image elements inside `/galleries/...` links are considered. For
indices `20..999`, one request is sent to the same endpoint with
`offset={selectedIndex}` and the first JSON array item is used. The response
fields are `g_url`, `t_url`, `t_url_460`, `gid`, and `mid`.

The adapter never requests `g_url` or downloads media bytes. It validates the
exact `cdni.pornpics.com` media hostname and promotes the thumbnail path from
`/300/` or `/460/` to `/1280/` while retaining the shard directories and hashed
filename. The resulting high-resolution CDN URL is placed directly in the
Discord embed; the Link button points to the validated gallery URL. Category
responses are bounded to 2 MiB, redirects remain restricted to PornPics hosts,
and malformed JSON, foreign hosts, insecure URLs, and unknown media paths are
rejected. No browser automation, gallery crawl, CDN binary fetch, proxy, or
transcoding step is used.

## Command-to-provider preservation

Every command source is explicit in its own module. The provider parity tests
cover all of the categories above, including style/gender/type source groups.
The `/gif` pool remains an equal top-level choice between Sex.com,
Porngifs.com, NekoBot `pgif`, and Porngifs.tv before fallback is applied.

`/cosplay` is a new active command rather than an archived provider mapping.
Its primary/fallback order and one-feed extraction contracts are covered by
dedicated executable tests.

The Real `/buttplug` PornPics source is also an intentional active extension.
Its archived Anime N-SFW source remains intact, and dedicated tests cover the
new option grouping, exact offset range, feed-only extraction, and 1280px URL
promotion.

The experimental endpoint studies in `archive/legacy/studies/` are preserved
as research documents. They were not active command implementations in the old
runtime and are therefore not silently promoted into production providers.
