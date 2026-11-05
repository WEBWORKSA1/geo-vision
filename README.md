# Geo.Vision

**See the planet, live.** Live Earth map (earthquakes, natural events, ISS, day/night), daily geography games, a 250-country atlas, map tools, guides, and a geospatial lead-generation service. Static site for GitHub Pages.

- Live site: https://geo.vision
- Idea & phase-wise build prompts: [BUILD-PROMPTS.md](BUILD-PROMPTS.md)
- Niche research (40+ sites): [RESEARCH.md](RESEARCH.md)

## How it works

```
src/pages/*.part     page bodies (first line = META JSON)
src/guides/*.part    long-form guides
build/build.mjs      wraps pages in the shared layout, generates /atlas (250 pages),
                     data/*.json, earth-today.html and sitemap.xml
assets/              CSS, JS (site, live, games, tools, country, home, atlas), images
.github/workflows/   daily build: refreshes Earth Today data and commits the output
```

Build locally:

```bash
npm install
npm run build        # writes HTML to the repo root
python3 -m http.server 8000
```

GitHub Actions runs the same build on every push to `src/`/`build/` and daily at 05:17 UTC, committing the generated pages to `main`, which GitHub Pages serves.

## Hosting (GitHub Pages, free)

1. Settings → Pages → Source: **Deploy from a branch** → `main` / `/ (root)`.
2. Custom domain `geo.vision` (the `CNAME` file is included). DNS at the registrar:
   - `A` @ → 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
   - `CNAME` www → webworksa1.github.io
3. Tick **Enforce HTTPS** once the certificate is issued.

## Monetisation checklist

- AdSense script (`ca-pub-6620975821265271`) on every content page; `ads.txt` at the root.
- In AdSense: add site `geo.vision`, enable Auto ads, and enable the Privacy & messaging consent message for EEA/UK/CH visitors.
- Forms submit through FormSubmit. The first submission triggers a one-time activation email to the owner's inbox — click it to start receiving leads.
- The contact address is never written in the source; it is assembled at runtime only when a form is sent or an email/donate button is clicked.

## Data & credits

NASA GIBS & EONET, USGS, OpenStreetMap contributors (ODbL), Natural Earth, mledoze/countries (ODbL), Open-Meteo (CC BY 4.0), wheretheiss.at, flagcdn.com, Leaflet (BSD-2). Geo.Vision is independent and not affiliated with GeoVision Inc. or any organisation named on the site — see `trademark.html`.
