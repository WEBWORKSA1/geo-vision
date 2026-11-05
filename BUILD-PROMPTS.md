# Geo.Vision — idea & phase-wise build prompts

## 1. The idea (and why it wins)

**Geo.Vision = "See the planet, live."** A live-Earth + geography-games + atlas + map-tools hub, monetised by AdSense and backed by a B2B geospatial lead-generation engine.

| Revenue engine | Traffic driver | Why it works |
|---|---|---|
| AdSense on high-volume pages | Daily Outline game, flag/capital quizzes, live quake map, 250 atlas pages, world clock/sun tools | Daily-habit games and "earthquake now" searches create repeat visits; atlas + tools capture long-tail search |
| AdSense on high-CPC pages | Guides: GIS, satellite imagery, drone mapping hiring, geospatial careers | Advertisers in software, drones, education and B2B data pay premium CPCs |
| **Lead generation** (primary profit) | Quick form on home + 4-step qualified brief on /projects + CTAs on every atlas page and guide | Drone survey, GIS, imagery and mapping jobs are worth $1k–$100k+; qualified leads sell or refer for $50–$500 each |
| Supply-side listings | "List your firm" provider form | Providers pay for briefs / featured listing after launch period |
| Sponsorship | Newsletter, game, contest and section sponsors | Brand-safe, clearly labelled placements |
| Donations | Support page tiers + pledge form | Funds operations, promotion, hiring, prizes |

Rejected alternatives: pure CCTV/"geo vision" camera reviews (trademark collision with GeoVision Inc. and low trust), generic travel blog (saturated), pure GIS SaaS (needs backend + capital).

Trademark rule: always "Geo.Vision" with the dot; never "GeoVision"; no surveillance/camera topics; explicit non-affiliation disclosure.

---

## 2. Phase-wise build prompts

Use these prompts in order with an AI coding assistant. Each phase ends with a checklist.

### Phase 0 — Research & positioning
> Research 35+ leading sites across map games (GeoGuessr, Seterra, Worldle, Sporcle), live Earth (USGS, NASA Worldview, Zoom Earth, Windy), reference (WorldAtlas, timeanddate, Worldometers), education (GIS Geography, Geography Realm, Esri) and B2B geospatial (Planet, SkyFi, UP42, EOSDA, DroneDeploy, Pix4D). Extract features, forms, CTAs, content structure, monetisation and design patterns into RESEARCH.md. Check trademark conflicts for the brand name and define avoidance rules.

✅ RESEARCH.md · feature checklist · trademark rules

### Phase 1 — Architecture & design system
> Build a static site for GitHub Pages (free, `main` branch, no server). Use a Node build script (`build/build.mjs`) that wraps page fragments from `src/pages/*.part` and `src/guides/*.part` in one shared layout and generates atlas pages from open data (world-countries, world-atlas/Natural Earth). Use relative paths so the site works on both the custom domain and github.io. Design: dark "mission control" theme, graticule background, Bricolage Grotesque / IBM Plex Sans / IBM Plex Mono, teal + amber accents, fully responsive, accessible (skip link, focus states, reduced-motion). Every page: top banner "Contact, if you are interested in this website/domain name/Sponsorship/Advertisement/Partnership" → https://web.works/contact; sticky nav; newsletter band; 5-column footer with legal links and non-affiliation notice; cookie notice.

✅ layout · CSS tokens · nav/footer · banner on every page

### Phase 2 — AdSense compliance foundation
> Add `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6620975821265271" crossorigin="anonymous"></script>` to the head of every content page (not the 404). Create ads.txt (`google.com, pub-6620975821265271, DIRECT, f08c47fec0942fa0`), robots.txt, sitemap.xml, canonical + OG tags, JSON-LD. Write About, Contact, Privacy (AdSense/third-party vendor cookie disclosures and opt-out links, GDPR/CCPA rights, lead-sharing consent), Cookie policy, Terms, Disclaimer and Trademark & Copyright pages. No ads on thin pages; no click-encouraging language; clear navigation; original content.

✅ ads.txt · legal pages · sitemap · no thin pages

### Phase 3 — Live Earth (self-updating)
> Build /live.html with Leaflet: base maps from NASA GIBS (Blue Marble, yesterday's MODIS true colour, VIIRS night lights) and OpenStreetMap with tile-error fallback; overlays for USGS earthquakes (feed switcher: hour / M2.5 day / M4.5 week / significant month, auto-refresh 2 min), NASA EONET natural events (emoji markers, storm tracks), ISS live position every 5 s with trail, 90-min forecast path and footprint (wheretheiss.at), computed day/night terminator and sub-solar point, "locate me". Side panel with layer toggles, ISS stats, event counts, clickable quake list. Add a daily GitHub Actions workflow that fetches USGS + EONET, writes data/earth-today.json and re-renders a crawlable Earth Today page and home-page blocks.

✅ live map · Earth Today auto-page · daily Action

### Phase 4 — Games (daily habit + virality)
> Build five games in vanilla JS using local data: Daily Outline (seeded daily country silhouette, 6 guesses, distance/arrow/proximity, streak stats, spoiler-free share grid, practice mode), Flag Frenzy and Capital Quest (60-second timed, same-region distractors, personal best), Bigger or Smaller (area streak), Pin the Country (blank Leaflet GeoJSON map, 10 rounds, distance/direction hints). Store progress in localStorage. Add an explanatory article under each game for content depth.

✅ 5 games · share loops · SEO text

### Phase 5 — Atlas + tools (long-tail SEO)
> Generate one page per country/territory (250) with a unique intro paragraph built from data (status, region, capital, area + comparison, rank, borders), key-facts grid, Leaflet map highlighting the country, on-demand live weather and local time (Open-Meteo), neighbours, same-subregion links, size neighbours, and lead/game CTAs. Build an atlas index with search, region anchors and top-10 list. Build tools: great-circle distance (map, bearing, midpoint, flight time), coordinate converter (DD/DMS/DDM/UTM/geohash), sunrise-sunset (sunrise equation, twilight, polar cases), world clock (IANA zones, saved list), antipode finder (land/ocean test).

✅ 250 atlas pages · 5 tools

### Phase 6 — Content (high-CPC guides + videos)
> Write 7 original, fact-checked guides (800–1,200 words): What is GIS, Map projections, How satellites see Earth, Earthquakes explained, Latitude & longitude, How to hire a drone mapping service, Careers in geospatial. Each with Article schema, sidebar lead CTA, related links. Build a video library with click-to-load privacy-enhanced YouTube embeds (verify every video ID via oEmbed) and official channel links.

✅ guides · verified videos

### Phase 7 — Lead generation (core profit)
> Build /projects.html: hero with trust chips, 3-step "how it works", a 4-step qualified brief (service cards → sector; location, size, deliverables, description → budget band, timeline, decision stage → contact + explicit consent to share with up to 3 providers), services grid, provider sign-up form, FAQ. Add a 4-field quick form on the home page and lead CTAs on every atlas page, guide and Earth Today. Pre-fill fields from query parameters (e.g. `?region=France`).

✅ multi-step brief · quick form · provider form · contextual CTAs

### Phase 8 — Donations, contests, careers, advertising
> Support page: fund selector (operations, promotion, hiring talent, contests & prizes), tiers ($5/$25/$100/custom) opening PayPal donations, pledge / sponsor / in-kind form, transparency table. Contests: monthly theme, categories, prizes, entry form, skill-based official rules (no purchase necessary, eligibility, licence, prizes, privacy), sponsor CTA. Careers: 6 remote roles + application form. Advertise: 6 sponsorship packages, labelled-sponsored policy, inquiry form, link to web.works/contact for website/domain acquisition.

✅ support · contests · careers · advertise

### Phase 9 — Forms & hidden email
> Route every form through one handler that POSTs JSON to FormSubmit's AJAX endpoint with the owner's address assembled at runtime from an encoded array (never present in HTML, JS strings, README or DOM), with honeypot spam trap, custom subject per form, inline success message and mailto fallback built on click. "Email us" links and PayPal donation links also build the address only on click.

✅ grep for the address returns nothing · test submission shows success

### Phase 10 — QA, deploy, grow
> Check: JS syntax, zero broken internal links, banner + ad code on every page, mobile layouts, form flow, no exposed email. Push to `WEBWORKSA1/geo-vision` `main`, enable GitHub Pages (Deploy from branch → main → /root), keep CNAME `geo.vision`, point DNS (4 A records to GitHub Pages IPs + `www` CNAME to `webworksa1.github.io`), enforce HTTPS. Then: activate FormSubmit (first submission sends a confirmation email), submit sitemap in Google Search Console, apply for AdSense and enable Auto ads + the Privacy & messaging GDPR consent message, and publish 2 new guides per month.

✅ live on geo.vision · AdSense application submitted

---

## 3. Growth roadmap
1. Weekly leaderboard for Daily Outline (needs a tiny serverless store).
2. Country comparison pages (`/compare/france-vs-spain`) — programmatic SEO.
3. Embeddable widgets (live quakes, daily puzzle) for teachers and bloggers → backlinks.
4. Localised versions (es, fr, hi, pt) of games and atlas.
5. Paid provider listings once lead volume is proven.
