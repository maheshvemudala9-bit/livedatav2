# SEO notes (TeluguSambandham frontend)

## What is in place
- `react-helmet-async` sets per-route title, description, canonical, robots, Open Graph, Twitter tags and JSON-LD (`src/components/seo/Seo.js`, `HelmetProvider` in `src/index.js`).
- All SEO data lives in `src/seo/siteConfig.js` (`ROUTE_SEO`). `App.js` mounts `<Seo {...ROUTE_SEO.<key>} />` on every route.
- Indexable: `/`, `/signup`, `/contact-us`, `/terms-and-conditions`. Everything else (login, forgot password, matches, profile details, search, private pages, `/adminhub/*`, `/impersonate`, the `*` 404 page) is `noindex, nofollow` with no canonical.
- `public/robots.txt` disallows private paths and points to the sitemap. `/login` and `/forgotpassword` are not disallowed so crawlers can read their noindex.
- `public/index.html` carries the home defaults, marked `data-rh="true"`.

## Editing SEO for a route
Edit the entry in `ROUTE_SEO` in `src/seo/siteConfig.js`. To add a new indexable route: add an entry with `noindex: false`, `changefreq` and `priority` (the `INDEXABLE_ROUTES` list is derived automatically), then mount `<Seo {...ROUTE_SEO.yourKey} />` in `App.js`. Keep titles around 50-65 characters and descriptions around 130-165.

## Post-build script
`npm run build` runs `react-scripts build && node scripts/seo-postbuild.js`. The script:
- strips `<title>` and every tag marked `data-rh="true"` from `build/index.html`;
- injects each indexable route's head block and writes `build/<route>/index.html` (home overwrites `build/index.html`);
- writes `build/sitemap.xml`;
- writes `build/serve.json` (rewrites: each indexable route to its own `index.html`, other extensionless paths to `/index.html`).

### Important: `serve -s` ignores the per-route files
The Dockerfile runs `serve -s build -l 3000`. With `-s`, serve always puts its own `** -> /index.html` rewrite first, so `/contact-us`, `/signup` and `/terms-and-conditions` are answered with the home-page head (Google still gets the right head after running JavaScript). To serve the per-route HTML to every crawler, change the Dockerfile command to `serve build -l 3000` (no `-s`). `build/serve.json` then provides the SPA fallback. This was tested locally with serve 14 and was NOT applied, because the Dockerfile was out of scope. `serve.json` is harmless under `-s`, but it is publicly readable at `/serve.json` (it only contains rewrite rules).

It respects `BUILD_PATH`. `REACT_APP_SITE_URL` (default `https://telugusambandham.com`) must be a real environment variable or Docker build arg when the script runs, because `.env` files are only read inside react-scripts. The injected tags also carry `data-rh="true"`, so react-helmet-async replaces them cleanly on the client (it removes `[data-rh]` tags it does not re-emit).

No headless browser is used. Page body content is still rendered by JavaScript.

## Known limits
- `serve -s build` answers 200 with the home page for unknown URLs (soft 404). Fix with a server rule (nginx/Caddy) that returns a real 404 for paths that are not known routes. Not implemented.
- Non-JavaScript crawlers get the home head on non-indexable routes (SPA fallback). Google runs JavaScript, so Helmet's noindex applies, and robots.txt blocks the private paths.
- `src/assets/css/style.css` has a render-blocking `@import` for Google Fonts. Moving it to a `<link>` is recommended and was not changed.

## After deploy
1. Verify the site in Google Search Console and Bing Webmaster Tools (DNS TXT record, or the meta tag they give you).
2. Submit `https://telugusambandham.com/sitemap.xml`.
3. Make sure http redirects to https and www redirects to the non-www host.
4. Set `CLIENT_ORIGIN` to `https://telugusambandham.com` in the production compose file.
5. Create a Google Business Profile for the Hyderabad office.
6. Run the Rich Results Test on `/` and `/contact-us`, and PageSpeed Insights on the four indexable pages.

`docker-compose.yml` contains real secrets. Move them to an env file or secret store. It was not changed.
