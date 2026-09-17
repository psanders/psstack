# Publishing — getting assets and ads into Meta

Two paths get a finished asset into a PAUSED ad: the API (via the Meta Ads MCP) and the Ads
Manager UI (via the browser). They fail in different places, so pick deliberately.

| | API path | UI path |
| :--- | :--- | :--- |
| Per-placement **image** customization (4:5 feeds + 9:16 vertical on one ad) | **No** — the connector's `ads_create_creative` customizes placements for video only (`placement_videos`) | **Yes** — replace the asset per placement group |
| Per-placement **video** customization | Yes | Yes |
| Works without a payment method on the account | Campaigns, ad sets, uploads and creatives yes; **ads no** (error 1359188) | **Yes**, as a saved draft |
| Carries `self_ai_disclosure` | Yes | **No** (`guardrails.md` §3) |
| Enhancement defaults | Set explicitly in the call | On by default in four places (`guardrails.md` §4) |
| Runs headless | Yes | No — needs a browser session |

**Default:** build campaign, ad set, uploads and creatives through the API, because that part is
scriptable and records cleanly. Then, if the ad needs a 9:16 image variant (it usually does) or
the account has no payment method yet, finish the ad in the UI as a draft. If only one canvas
exists, or the account is MCP-enabled with a payment method and the asset needs AI disclosure,
finish through the API.

## Uploading an image headlessly

`ads_creative_upload_media` with `upload_source: LOCAL_FILE` opens Meta's own picker app, which
cannot open in a terminal client. The three-step local-image flow works headlessly and has no
such dependency:

1. **Prepare.** `ads_creative_upload_local_image` with the file's byte size and its SHA-256
   (`shasum -a 256`). It returns an `upload_url` and the session's entity metadata.
2. **POST the bytes** to that `upload_url` with the entity headers — the authorization header,
   `offset: 0`, `X-Entity-Name`, `X-Entity-Length`, `X-Entity-Type`, and `file_size`. A plain
   `curl` works. The response carries the upload handle.
3. **Finalize.** `ads_finalize_local_ad_image_upload` with that handle. It returns the
   `image_hash` to use in the creative.

Rules:

- **Upload JPEG, not PNG.** Meta rejects Pencil's 8-bit RGBA PNG with "Invalid image format".
  Convert on export (`canvases.md` → Export step 4).
- The file must be somewhere this session can read; a path inside the repo or the scratchpad is
  fine, an external drive or another user's home is not.
- Record every `image_hash` against its canvas before moving on — re-uploading is cheap, but
  matching hashes to canvases after the fact is not.
- **Never publish creative to a public host** just to obtain a URL for `upload_source: URL`
  without asking first.

## Uploading through the browser (fallback)

When a file has to go through an Ads Manager upload control (media library, or replacing an
asset on a draft), the native file picker is the obstacle: Meta's upload button creates a
**hidden file input**, clicks it, and removes it, so there's nothing left to drive.

1. Patch `HTMLInputElement.prototype.click` so the click is swallowed and the input **stays in
   the DOM** instead of opening a native picker.
2. Click Meta's upload button. The hidden input is now findable.
3. Drive that input with the file-upload tool, pointing at the local path.
4. Restore the prototype afterwards so the rest of the page behaves normally.

The file still has to live somewhere the session can read. Confirm the thumbnail appears in
Meta's media list before continuing — a silent no-op looks identical to success.

## Building an image ad in the UI

Use when the API can't attach the 9:16 variant, or the account isn't MCP-enabled.

1. Open the ad set (created via the API) in Ads Manager and add an ad to it.
2. **Media picker** — select the `feed-4x5` asset from the account's media library (upload it
   first via the fallback above if it isn't there).
3. **Crop step** — Meta offers crops per aspect ratio. Set the 4:5 crop to the full asset;
   don't accept an auto-crop that cuts through the content box.
4. **Replace per placement group** — open the placement customization list and replace the
   asset for the vertical group (Stories / Reels / Status) with the `vertical-9x16` file, and
   the square group with `square-1x1` if one was built. Each group renders its own preview;
   check all of them.
5. Set the copy fields, the URL and the CTA to exactly what the plan approved.
6. Walk the **four** enhancement panels in `guardrails.md` §4 and turn off what the framework
   defaults off. Verify visually.
7. **Stop at Publish.** Save the draft and hand back. Publishing is a go-live decision and
   needs an explicit "yes" for that action — the same rule as `ads_activate_entity`.

Afterwards, pull the created ad with `ads_get_ad_entities` so the tracker records the real ad
and creative IDs rather than a hand-typed name.
