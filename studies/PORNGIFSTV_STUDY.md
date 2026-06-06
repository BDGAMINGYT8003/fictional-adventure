# Porngifs.tv Extraction & Feasibility Study

## 1. Network Architecture Mapping
*   **Infrastructure:** The site does not use infinite scrolling in the traditional sense of triggering a request automatically when reaching the bottom. Instead, it relies on an explicit "Load more" button click, which fires an asynchronous AJAX request to retrieve more HTML content.
*   **API Interception:** The network payload reveals that the "Load more" button acts as a trigger for a structured query to the backend. The endpoint handling these requests is `https://porngifs.tv/?action=ajax&mode=async&function=get_block&block_id=list_videos_most_recent_videos&sort_by=post_date&from={X}`.
*   **Response Payload:** Unlike modern JSON APIs, this endpoint responds with raw HTML snippets that are subsequently appended to the DOM.

## 2. State Persistence & Offsets
*   **Pagination Scaling:** The state and offset of the media list are strictly managed by the `from` query parameter in the AJAX request url. Sending `from=2` fetches the second "page" or "block" of media items.
*   **Database Ceiling:** Examining the attributes of the "Load more" button embedded in the HTML response reveals a `data-max-queries="2603"` property. This provides the exact hard ceiling for pagination. Assuming an average of 24 to 25 items per block, the database contains approximately **~62,000 to 65,000** total media entries.
*   **Total Randomization Strategy:** True randomization can be easily achieved. Since the maximum page index is exposed, a script can simply generate a random integer between `1` and `2603`. By requesting the AJAX endpoint with `from=<RANDOM_INT>`, the script can instantly drop into any random block in the site's deep history.

## 3. Direct Media Access
*   **HTML Extraction:** The raw HTML response contains `.item` divs for each piece of media. Inside these, an anchor `<a>` tag contains the direct media URL under the `data-webp` attribute. A regular expression like `data-webp="([^"]+)"` can quickly capture these links.
*   **CDN Integration:** The media is hosted on a dedicated CDN (e.g., `https://content.porngifs.tv/`).
*   **Format Verification:** Despite the site's name, the primary high-quality media sources are served as either animated **`.webp`** files or **`.webm`** videos, rather than native `.gif` files.
*   **Discord Integration Constraints:** Because Discord struggles to natively play animated `.webp` files as image embeds, and cannot directly embed raw `.webm` video URLs without them displaying as downloadable files or links, these formats require processing. For Discord integration, the raw binary buffer of the WebP/WebM must be fetched from the CDN and transcoded via `ffmpeg` into a native `.gif` or standard `.mp4` before being attached.

## 4. Automation Strategy & Execution
*   **Security Posture:** The site's primary AJAX endpoint is highly permissive. It can be accessed directly using standard HTTP GET requests via `curl` or `axios` without any authentication tokens, cookies, or complex header spoofing.
*   **Execution Strategy:** Heavy headless browser automation (e.g., Puppeteer, Playwright) is unnecessary. High-speed, lightweight `Axios` requests, combined with regular expressions or lightweight HTML parsers like `cheerio`, are perfectly viable for both randomization and bulk harvesting.

### Conclusion
`porngifs.tv` is highly vulnerable to programmatic extraction. Its exposed AJAX endpoint allows direct access to paginated HTML blocks without rendering overhead. By leveraging the `from` parameter and the publicly exposed `data-max-queries` ceiling, complete and instant randomization is achievable. The only significant hurdle for a bot integration is the necessity to transcode the `.webp` and `.webm` media payloads into native Discord-compatible formats (`.gif` or `.mp4`) using a server-side FFmpeg pipeline.
