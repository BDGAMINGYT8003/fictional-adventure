# Porngifs.com Extraction & Feasibility Study

## 1. Network Architecture Mapping
*   **Infinite Scrolling Mechanism:** The website operates its infinite scrolling by triggering a `POST` request to the endpoint `/ajax/scrolldown` every time the bottom of the viewport is approached.
*   **Payload Data:** The AJAX request simply sends a `loadcount` integer (and an optional `tag` string for category filtering) encoded as `application/x-www-form-urlencoded`.
*   **Response Handling:** The endpoint responds with a clean JSON array containing 20 media objects. For example:
    ```json
    [{"id":"22160","title":"","src":"22160","gif":"0"}]
    ```

## 2. State Persistence & Offsets
*   **The `loadcount` Parameter:** The `loadcount` acts exactly like a traditional pagination offset. For example, sending `loadcount=100` tells the backend to return items 100 through 120.
*   **Database Ceiling:** A binary search script was run against the `loadcount` parameter to find the hard ceiling of the database. The endpoint successfully returns arrays up to `loadcount=29951`. Any request past this limit returns a raw boolean `false`.
*   **Total Inventory:** This indicates the site's primary feed pool contains approximately ~30,000 indexable GIF entries.

## 3. Direct Media Access
*   **Pathing:** The JSON payload provides a `src` ID. This ID maps cleanly to the site's dedicated Content Delivery Network (CDN).
*   **URL Construction:** The media is located at `https://cdn.porngifs.com/img/<src>`.
*   **Native GIF Verification:** A cURL `HEAD` request against the CDN verified that the files are served directly with the `content-type: image/gif` header. There are no MP4 conversions, WebP obfuscations, or heavy media wrappers preventing direct extraction.

## 4. Automation Strategy & Execution
*   **Security Posture:** The site does not employ aggressive anti-bot middleware (such as Cloudflare Turnstile, captchas, or complex dynamic token signing) for its API endpoints.
*   **Execution Strategy:** Due to the lack of security hurdles and the clean JSON response structure, a heavy headless browser automation suite (like Puppeteer) is completely unnecessary. High-speed, lightweight `Axios` or `fetch` requests are perfectly sufficient for massive bulk extraction.
*   **Total Randomization Methodology:** True randomization without sequential scrolling can be achieved instantly. A script only needs to generate a random integer between `0` and `29950`, pass it into the `loadcount` POST parameter, and extract the `src` value from the very first object in the returned JSON array to get a perfectly randomized result from the total database pool.