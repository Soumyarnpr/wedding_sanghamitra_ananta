# Sanghamitra and Ananta’s wedding invitation

A mobile-first Odia Hindu wedding invitation built with React, TypeScript, Vite, Tailwind CSS, and GSAP. The application follows the printed wedding card for dates, venue, and family contacts.

## Run locally

Use Node.js 22 or later.

```powershell
npm ci
npm run dev
```

Open the local address printed by Vite. Run `npm run check` for type checking and `npm run build` to produce the static app in `dist`. Serve that directory from a static web host. The Sites manifest also points to `dist`.

## Edit the invitation

Use [`src/config/wedding.config.json`](src/config/wedding.config.json) for names, invitation copy, dates, ceremony details, links, media, and theme settings. Run a new build after changing it.

| Setting | How to use it |
| --- | --- |
| Couple portraits | Put the two photos in `public/assets/` and set `couple.bride.image` and `couple.groom.image` to their `/assets/…` paths. Add descriptive alt text. Empty paths show the couple’s initials. |
| Story and album | Set `story.text` and add 6–10 entries to `gallery`. Each entry takes `src`, `alt`, and `caption`. The illustrated keepsakes appear until real photos are added. |
| Wedding and ceremonies | Use ISO dates such as `2026-12-02`, 24-hour times such as `19:00`, and an IANA timezone such as `Asia/Kolkata`. Add events with unique IDs. Use `"venue": "wedding"` to reference the shared venue. The printed card confirms only the reception time, so the ceremony time fields are empty. |
| Venue | Set `wedding.venue.image`, `imageAlt`, and any travel details. The built-in directions link uses the printed venue name and locality. Add `mapsPlaceId` or `mapsUrl` to select a confirmed pin. |
| Music and artwork | Replace the files in `public/assets/` and update `music.src` or the relevant `artwork` paths. Audio attempts autoplay once and then offers a play button if the browser requires a tap. |
| Footer | Set the supplied advertisement image, its alt text, portfolio URL, and Instagram URL in `branding`. |
| Theme and motion | Change colors and font families under `theme` and `fonts`. Use `animation.enabled` and the petal counts to adjust animation. The app also follows the visitor’s reduced-motion setting. |

## Calendar

The countdown targets the start of the wedding date in the configured timezone until a ceremony time is supplied. Set `wedding.countdown.time` to override the target. Google Calendar opens an all-day entry until both a valid start and end time are configured. The event description includes the printed schedule and a directions link.

The downloadable iCalendar file contains display alarms for 5:00 p.m. India time on December 2 and November 30. The printed schedule has no time for the two-days-before reminder, so it defaults to 5:00 p.m. as well. Adjust both under `calendar.reminders`. Google Calendar’s template link cannot carry those alarms, and calendar apps may handle imported alarms differently. [Google Calendar import help](https://support.google.com/calendar/answer/37118) · [iCalendar alarm specification](https://datatracker.ietf.org/doc/html/rfc5545#section-3.6.6)

## RSVP

The RSVP section shows a Google Sheets placeholder and the phone contacts from the printed card. Replace `REPLACE_WITH_RSVP_SHEET_URL` in `rsvp.sheetUrl` with a shared Sheet URL intended for guests. The link opens the Sheet. For guests to submit responses through a form, link a Google Form to your response spreadsheet and put the guest-facing form URL in `rsvp.formUrl`. The form takes precedence over the direct Sheet link. [Google Forms response destinations](https://support.google.com/docs/answer/2917686)

For an inline RSVP form, set `rsvp.endpoint` to an HTTPS endpoint that supports the invitation origin through CORS. It receives a `POST` with a `text/plain` JSON body containing `name`, `attendance` (`yes` or `no`), `guests`, and `submissionId`. Validate on the server, treat the ID as an idempotency key, and return an HTTP success response with `{"ok": true}` only after storing the response. Keep Sheets credentials on the server. The app reports a submission as confirmed only after receiving that acknowledgment.

## Artwork

The [cover](public/assets/hero.webp) and six [illustrated keepsakes](public/assets/) were made with the built-in image generation tool and optimized as WebP. The gallery images depict wedding motifs. The venue displays a labeled decorative illustration until a photograph is provided.

<details>
<summary>Artwork prompts</summary>

**Cover**

Use case: illustration-story. Create the background illustration for a royal Odia Hindu wedding invitation web cover. Landscape aspect ratio 3:2. A fine antique block print meets an editorial painted botanical border. Deep uniform near-black plum-maroon #310b18 throughout with restrained textural flecks. Build a symmetrical, sumptuous decorative frame from dramatic dusty rose, brick red, and muted blush pink lotus blossoms and buds, intricately stippled antique-gold stems and leaves and small pale orange marigold accents. These ornaments grow up from each bottom corner and drape from both top corners, contained within the outer 23% on either side. Tall gold-outline Odisha temple silhouettes, inspired by Kalinga rekha deula forms, sit in extreme lower corners behind flowers, subtle and unobtrusive. Tiny old-gold pinprick ornaments, nothing crowded. Leave the entire central 55% completely empty deep uniform maroon, including top and bottom at center, for actual legible title overlay added separately in code. Text-free, no people, no deity, no rings, no frames around central text, no typography, no watermark. High end Indian letterpress stationery, precise naturalistic flowers, restrained metallic pigments, very sophisticated rather than loud.

**Keepsake collection**

Illustration-story, single 3:2 landscape atlas for six equally sized square keepsake prints in a royal Odia wedding invitation. Precisely divide canvas into 3 columns and 2 rows of equal square size, with no whitespace or borders. Each cell has its own continuous background and one centered traditional still life or motif, with safe margins so can crop by a strict grid. TOP LEFT: dusty pink lotus with antique gold leafwork against wine maroon. TOP CENTER: terracotta diya with glowing wick against warm dusty pink and saffron. TOP RIGHT: copper kalash holding a coconut and mango leaves against muted warm peach. BOTTOM LEFT: bunch of saffron orange marigolds against deep muted red. BOTTOM CENTER: carved sandstone Kalinga temple arch, charcoal wine shadow and fine gold texture, no statues. BOTTOM RIGHT: two loosely intertwined flower garlands of cream jasmine and small pink roses on deep near black plum. Unified fine-grain vintage miniature painting or highly detailed antique lithograph. Rich, muted ink and handpainted textures, romantic sophisticated fine Indian stationery. All six compositions should feel like separate distinct square pieces. No people, no text, no letters, no logos, no watermark.

</details>
