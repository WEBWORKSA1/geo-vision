# Geo.Vision

**See the planet, live.** Live Earth map (earthquakes, natural events, ISS, day/night), daily geography games, a 250-country atlas, map tools, guides, and a geospatial lead-generation service. Built for GitHub Pages (free plan, `main` branch).

- Live site: https://geo.vision
- Idea & phase-wise build prompts: [BUILD-PROMPTS.md](BUILD-PROMPTS.md)
- Niche research (40+ sites): [RESEARCH.md](RESEARCH.md)

## How it works

GitHub Pages builds the site with Jekyll on every push — no build step or Actions workflow needed.

```
_config.yml          site settings (includes_dir: src, jekyll-sitemap)
_layouts/            default (head, AdSense, banner, nav, footer), guide, country
_data/countries.json 250 countries & territories (mledoze/countries, ODbL)
src/pages/*.part     page bodies, included by the wrapper pages
src/guides/*.part    long-form guides
*.html, play/, tools/, guides/, atlas/   thin wrapper pages (front matter + include)
data/countries.json  JSON endpoint generated from _data for the games and tools
assets/              CSS, JS (site, live, home, earth, games, tools, country, atlas), images
```

Live content updates itself in the browser: USGS earthquakes, NASA EONET events, the ISS position, NASA GIBS satellite imagery, a new Daily Outline puzzle every day (UTC) and live weather on atlas pages.

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

NASA GIBS & EONET, USGS, OpenStreetMap contributors (ODbL), Natural Earth (via world-atlas on jsDelivr), mledoze/countries (ODbL), Open-Meteo (CC BY 4.0), wheretheiss.at, flagcdn.com, Leaflet (BSD-2). Geo.Vision is independent and not affiliated with GeoVision Inc. or any organisation named on the site — see `trademark.html`.
