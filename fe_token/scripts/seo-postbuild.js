// Post-build SEO step (runs after `react-scripts build`).
//  - writes build/<route>/index.html for every indexable route with its own
//    title, description, canonical, Open Graph / Twitter tags and JSON-LD
//  - rewrites build/index.html with the home-page tags
//  - writes build/sitemap.xml
// No dependencies, no headless browser. Respects BUILD_PATH.
// REACT_APP_SITE_URL must be a real environment variable (see SEO.md).

const fs = require('fs');
const path = require('path');
const {
  SITE_NAME,
  LOCALE,
  DEFAULT_OG_IMAGE,
  absoluteUrl,
  ORGANIZATION_JSONLD,
  WEBSITE_JSONLD,
  INDEXABLE_ROUTES,
} = require('../src/seo/siteConfig');

const buildDir = path.resolve(process.cwd(), process.env.BUILD_PATH || path.join(__dirname, '..', 'build'));
const indexPath = path.join(buildDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('[seo-postbuild] ' + indexPath + ' not found. Run react-scripts build first.');
  process.exit(1);
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const jsonLd = (obj) =>
  JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

// Remove everything a previous run, or the default index.html, marked data-rh.
function stripManaged(html) {
  return html
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<script[^>]*data-rh=["']?true["']?[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<(meta|link)[^>]*data-rh=["']?true["']?[^>]*>/gi, '');
}

function headBlock(r) {
  const url = absoluteUrl(r.path);
  const m = (attr, name, content) => '<meta data-rh="true" ' + attr + '="' + name + '" content="' + esc(content) + '">';
  const lines = [
    '<title data-rh="true">' + esc(r.title) + '</title>',
    m('name', 'description', r.description),
    m('name', 'robots', 'index, follow'),
    '<link data-rh="true" rel="canonical" href="' + esc(url) + '">',
    m('property', 'og:type', 'website'),
    m('property', 'og:site_name', SITE_NAME),
    m('property', 'og:title', r.title),
    m('property', 'og:description', r.description),
    m('property', 'og:url', url),
    m('property', 'og:image', DEFAULT_OG_IMAGE),
    m('property', 'og:locale', LOCALE),
    m('name', 'twitter:card', 'summary_large_image'),
    m('name', 'twitter:title', r.title),
    m('name', 'twitter:description', r.description),
    m('name', 'twitter:image', DEFAULT_OG_IMAGE),
  ];
  [ORGANIZATION_JSONLD, WEBSITE_JSONLD].concat(r.jsonLd || []).forEach((b) => {
    lines.push('<script data-rh="true" type="application/ld+json">' + jsonLd(b) + '</script>');
  });
  return lines.join('');
}

const base = stripManaged(fs.readFileSync(indexPath, 'utf8'));
if (!/<\/head>/i.test(base)) {
  console.error('[seo-postbuild] </head> not found in index.html');
  process.exit(1);
}
const render = (r) => base.replace(/<\/head>/i, headBlock(r) + '</head>');

const written = [];
INDEXABLE_ROUTES.forEach((r) => {
  const html = render(r);
  const out = r.path === '/' ? indexPath : path.join(buildDir, r.path.replace(/^\//, ''), 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  written.push(out);
});

const today = new Date().toISOString().slice(0, 10);
const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  INDEXABLE_ROUTES.map(
    (r) =>
      '  <url>\n' +
      '    <loc>' + esc(absoluteUrl(r.path)) + '</loc>\n' +
      '    <lastmod>' + today + '</lastmod>\n' +
      '    <changefreq>' + r.changefreq + '</changefreq>\n' +
      '    <priority>' + r.priority + '</priority>\n' +
      '  </url>\n'
  ).join('') +
  '</urlset>\n';
fs.writeFileSync(path.join(buildDir, 'sitemap.xml'), sitemap);

// serve.json for `serve build` (WITHOUT -s). `serve -s` always puts its own
// `** -> /index.html` rewrite first, so with -s every route gets the home head.
// Without -s, serve reads this file from the served folder: each indexable route
// maps to its own index.html and everything else falls back to the SPA shell.
const serveConfig = {
  rewrites: INDEXABLE_ROUTES.filter((r) => r.path !== '/')
    .map((r) => ({ source: r.path, destination: r.path + '/index.html' }))
    // serve-handler re-applies the remaining rules to each rewrite target, so the
    // SPA fallback must not match file paths (anything with a dot), otherwise it
    // would turn /contact-us/index.html back into /index.html.
    // (No `*` in the pattern: serve-handler rewrites `*` to `(.*)` before matching.)
    .concat([{ source: '/:path([^.]+)', destination: '/index.html' }]),
};
fs.writeFileSync(path.join(buildDir, 'serve.json'), JSON.stringify(serveConfig, null, 2) + '\n');

console.log('[seo-postbuild] wrote ' + written.length + ' pages + sitemap.xml + serve.json in ' + buildDir);
written.forEach((w) => console.log('  ' + w));
