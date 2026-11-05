# A day, together

A responsive, buildless wedding invitation. It uses semantic HTML, CSS, and small JavaScript files with no application dependencies or tracking scripts.

## Preview and deploy

Use Node.js 18 or newer. There are no dependencies to install. Run `npm run dev` (or `node tools/serve.mjs`) and open `http://localhost:4173`. Set the `PORT` environment variable if that port is occupied. Run `npm run check` for JavaScript syntax checks, `npm test` for calendar behavior tests, and `npm run build` to refresh metadata and prepare the publishable `dist/` folder. Serve that folder with any static host. Run `npm run metadata` to refresh just the source HTML metadata after editing content. A server, rather than double-clicking HTML, is recommended for testing form integrations.

## Personalize the invitation

Edit **`content.js`** for all personal content: names, invitation copy, wedding date and location, story, captions and alternative text, events, surprise message, RSVP settings, guest information, contact details, and social metadata. All missing personal details use square-bracketed placeholders. Keep event `id` values unique and stable when adding or removing event objects. Colors, fonts, spacing, and other repeated design values live in `:root` in `styles.css`.

Set each photo’s `src` to an owner-supplied image path, for example `assets/cover.webp`, and write its actual `alt` and `caption`. Empty `src` values intentionally show labeled placeholders; there are no fabricated couple photographs. Export well-cropped WebP/AVIF or JPEG images, around 1600 pixels wide for the cover and feature, and 900 pixels wide for gallery images. The layout crops with `object-fit: cover`. Gallery images are lazy-loaded. Keep decorative art separate from meaningful photo alternative text.

Set `meta.title`, `meta.description`, `meta.siteUrl`, and `meta.previewImage`. The supplied 1200×630 PNG is a sharing placeholder; replace it with your own JPG/PNG after personalizing. An editable SVG design is also included. Run the metadata sync command so crawlers receive updated tags in the HTML without executing JavaScript. The favicon is in `assets/`. The hosted preview starts private, so social crawlers need the site to be guest-accessible before they can retrieve its metadata.

## Events, directions, and calendar

Every event has visible date, time, time zone, venue, full address, dress code, and notes. `directionsUrl` accepts an HTTPS map or directions link. Without a configured destination, the interface explains that directions are not ready instead of taking guests to a fabricated venue.

The visible `date`, `startTime`, `endTime`, and `timeZone` are display copy. Set `calendar.start` and `calendar.end` separately to real ISO dates with seconds and an explicit UTC offset or `Z`, using `YYYY-MM-DDTHH:MM:SS+HH:MM`. Match the offset to the venue’s time zone on the event date, including daylight-saving rules. Events spanning midnight need the following date in `calendar.end`. Calendar downloads validate real dates and ordering, convert to UTC, escape text, and fold long UTF-8 lines. Blank or invalid calendar settings produce an accessible explanation without downloading an invalid invitation. No external calendar API or credentials are needed.

## Connect RSVP

An empty **`rsvp.endpoint` keeps RSVP in demo mode**. The form validates entries and clearly states that no reply was sent or saved. Demo guest data is not persisted in browser storage or transmitted. No contact information is collected unless you deliberately add a field for it.

To accept real replies, configure an HTTPS endpoint (or a same-origin `/api/...` route) you control in `rsvp.endpoint`. The client sends a JSON `POST` body with `guestName` and `attendance` (`accepts` or `declines`); accepted replies also include `partySize` and any provided `meal`, `dietaryRequirements`, and `accessibilityRequests`. The endpoint must validate and persist the submission server-side, then return a successful HTTP status **and JSON `{ "success": true }`** to acknowledge receipt. A 2xx response alone does not count as a confirmed RSVP. Allow this site’s origin if hosted separately and use non-2xx responses for failures. Never put private API keys in `content.js` or any browser file. Provision a server endpoint separately; static hosting does not create an RSVP database automatically.

Set `rsvp.invitedPartySize` to the maximum number of guests covered by this invitation. It includes the named guest. `null` leaves an explicitly labeled demo limit until the owner configures it. Replace `rsvp.mealOptions` with real choices, or set it to `[]` to omit the meal question. Dietary and accessibility requests are separate optional fields. Declining guests do not need a guest count or meal choice. Update the endpoint’s retention and access practices to suit the invitation; the website adds no analytics or tracking scripts.

## Accessibility and small screens

The page includes a skip link, visible focus styles, reduced-motion support, an operable mobile menu, native disclosure controls, accessible inline form errors and status updates, and a keyboard gallery dialog with focus return. The scratch card has a visible reveal button and keeps its message available to assistive technology. Test real replacement content at 320 pixels, wide desktop, and 200% zoom before sending the invitation. Real names, venue addresses, photo crops, endpoint errors, and screen reader behavior deserve a final review after personalization.
