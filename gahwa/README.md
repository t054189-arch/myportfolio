# gahwa — a coffee check-in module

A self-contained check-in log that any coffee shop's website can embed with
one line. It carries its own styles, its own strings, its own auth, its own
QR encoder and its own database migrations.

**The test applied to every decision in this folder:** if the site hosting
it were deleted tomorrow, would this still run? Where the answer was no,
the coupling was in the wrong place and moved.

```
gahwa/
  gahwa.css      its own tokens (--g-*), warm and dark
  gahwa.js       the module: check in, read log, stats, stickers, map, QR
  embed.js       the one line another site includes
  checkin.html   widget in an iframe / check-in as a popup — the only page with auth
  log.html       the personal log: timeline, stickers, map, export, delete
  venue.html     a venue page, its board, and a printable A6 counter card
  sql/           its own migrations
  functions/     the Edge Function that checks counter codes
```

## Two rules

**1. Nothing in here references the host site.** No host stylesheet, no
host token names, no font loaded by a brand's name, no product IDs. There
is a script that checks this (`isolate.sh` in the notes below); it passes.

**2. A host talks to it through exactly one door.**

```js
gahwa.configure({ url, key, theme, lang, getToken })   // optional
gahwa.checkIn({ venue, rating, drink, note, code })    // the entry point
gahwa.myCheckIns({ itemRef, venue, since })            // your own rows
```

...or, from another origin, through `embed.js`. Bloom uses the embed on its
café page and `myCheckIns()` for bag tracking, and nothing else.

## Embedding it

```html
<div id="gahwa"></div>
<script src="https://<your-host>/gahwa/embed.js"
        data-venue="riwaq-jabriya"
        data-theme="dark"
        data-lang="en"
        data-mount="#gahwa"
        async></script>
```

That inserts an **iframe**, not markup. The host page's CSS cannot reach
inside it, and neither can the host page's JavaScript.

Three messages cross the boundary, origin-checked at both ends:

| Message | Payload |
|---|---|
| `gahwa:ready` | — |
| `gahwa:resize` | `{ height }` |
| `gahwa:checkin` | `{ venue_id, at }` |

That is the whole contract. A café learns that a check-in happened at their
venue. Not who, not how often, not where else that person drinks.

## Signing in from someone else's site

The widget sits on a different origin from the app, so it cannot share a
session with it, and third-party cookies are blocked in most browsers now.
So it does not try:

1. The visitor clicks **Check in** inside the iframe.
2. The iframe calls `window.open()` on **our** origin.
3. They sign in there — first-party, where it simply works — and complete
   the check-in.
4. The popup posts `gahwa:checkin` to the iframe (same origin), the iframe
   forwards `{ venue_id, at }` to the host, and the popup closes.

Tokens exist only on the app origin and are never handed to the opener.
Verified with third-party cookies switched off.

## QR check-in

Every venue's page generates a printable A6 card with a QR encoding:

```
https://<your-host>/gahwa/checkin.html?venue=<slug>&src=qr
```

Scanning opens the check-in already filled in. The QR is encoded in
`gahwa.js` — byte mode, error correction M, versions 1–10 — rather than
fetched from a CDN, because a module that pulls a library onto somebody
else's website has added a request and a dependency to their site.

The encoder is verified module-for-module against a reference
implementation across three symbol versions.

### Verified vs unverified

A printed QR can be photographed and used from a sofa. That is fine for a
diary and not fine for a public board, so the two are split:

- **any** check-in counts for the person's own log, stickers, streak and map;
- a check-in that also carries the **counter code** is checked in an Edge
  Function against `venue_codes` and marked `verified`;
- the **regulars board counts verified check-ins only**.

`venue_codes` has row-level security enabled and **not one policy**, so no
browser holding any anon or authenticated key can read a code. Only the
service key, inside the function, can.

Codes are never committed: the seed generates a random one for the two
venues this project controls. Read yours from the dashboard.

---

## The demo, as a script

Two servers, so the popup flow is genuinely cross-origin:

```bash
# the app (Bloom + the gahwa module)
python3 -m http.server 5500
# the demo café, a different origin with none of the module's files
cd demo && python3 -m http.server 5501
```

Then:

1. **Open `localhost:5500/cafe.html`.** Bloom's café page, with the widget
   embedded by the same one line any other shop would use. Click **Check
   in** — a popup opens on `:5500`. Sign in there (once). Enter the counter
   code. The popup closes.
2. **Open `localhost:5501/riwaq.html`.** A visibly different website — near
   black, acid green, condensed caps — on a different port. The widget in
   the corner still looks like itself. Click **Check in**: the popup opens
   **already signed in**, because the session is first-party on `:5500`.
3. **Check in.** The popup closes. Riwaq's own panel prints exactly what it
   received: `{"venue_id":"riwaq-jabriya","at":"…"}` and the line
   `keys received: venue_id, at`. It also prints its two failed attempts to
   read inside the widget and into its storage.
4. **Open `localhost:5500/gahwa/log.html`.** Both cups, one timeline, one
   streak, one map, stickers counting both.
5. **Open `localhost:5500/gahwa/venue.html?venue=riwaq-jabriya`** and scan
   the printed card with a phone. The check-in opens prefilled with Riwaq.
6. **Enter the counter code.** The check-in is marked verified and appears
   on Riwaq's board. Without the code it stays in the log and never reaches
   the board — visible on the venue page, where the count does not move.

## What this does not do yet

Each of these is a known next step, not an oversight.

- **No claim-your-café verification.** Venues are seeded or user-created;
  a shop cannot yet prove a listing is theirs. `venues.tenant_id` exists
  for that flow and is null on every row.
- **No café dashboard and no café accounts.** A shop gets the widget and
  the board. Nothing else.
- **No moderation queue and no duplicate-merging tool.** `status` and
  `merged_into` are in the schema and resolved on read, but nothing drives
  them. The directory would need both before it could be opened publicly.
- **The counter code is per venue and rotated by hand**, not automatically.
- **No friends, tagging, blocks or "here now".** These were named in the
  privacy rules but were never built, so those rules are satisfied by
  absence rather than by code. If any of it is added, the rules apply from
  the first commit: friendship mutual, nothing public, home and work never
  named to anyone else, tagged people able to untag themselves, blocks
  working both ways.
- **The module keeps its own session.** Signing into a host's shop is not
  signing into the log. That is the cost of the separation, not a bug — a
  module that shared a session with whatever site embedded it would be the
  coupling this refactor removed. A host that wants to lend its token can,
  via `configure({ getToken })`.

## Privacy, carried with the module

- One policy on `gahwa_logs`, and it is the owner's own. **No staff read,
  no admin screen, and none may be added.** Verified against Postgres: a
  second account sees none of the first's rows through the table or through
  any of the five views.
- **Never mined for marketing.** Not for recommendations, not for segments.
- **No GPS, ever.** The browser is not asked where it is. A venue is a name
  in a shared directory; the map colours governorates the directory already
  states.
- **Photos** live in a private bucket under a per-user folder, reached by
  signed URLs that expire.
- **Delete means delete**: per entry and whole-log, photos first through the
  Storage API, then rows. No tombstone, no soft-delete column.
- **Nothing personal in browser storage** beyond the session token. The log
  is held in memory while the tab is open.
- **No public profiles, no sharing links, no leaderboards.**
