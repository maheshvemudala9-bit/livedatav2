// services/imageService.js
// ─────────────────────────────────────────────────────────────────────────────
// Handles image resizing into 3 sizes using Sharp
// original → as uploaded (after initial compress)
// medium   → 600×800px  (profile details, messages)
// thumb    → 300×300px  (sidebar, listing cards, header, dashboard)
// ─────────────────────────────────────────────────────────────────────────────

const sharp  = require('sharp');
const path   = require('path');
const fs     = require('fs');

// ── Output directory — adjust if your uploads folder is different ─────────────
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'gallery');

// ── Size configs ──────────────────────────────────────────────────────────────
const SIZES = {
  original: { width: null,  height: null  }, // kept as-is
  medium:   { width: 600,   height: 800   }, // profile details / messages
  thumb:    { width: 300,   height: 300   }, // sidebar / listing / header (bumped from 150 for sharper display)
};

// ── Ensure upload directory exists ────────────────────────────────────────────
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// ── Convert base64 to Buffer ──────────────────────────────────────────────────
const base64ToBuffer = (base64String) => {
  // Remove data:image/xxx;base64, prefix
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
};

// ── Get file extension from base64 ───────────────────────────────────────────
const getExtension = (base64String) => {
  const match = base64String.match(/^data:image\/(\w+);base64,/);
  return match ? match[1].replace('jpeg', 'jpg') : 'jpg';
};

// ── Max dimension for the "original" — keeps full-quality look while avoiding
//    storing enormous multi-MB phone photos that are only used in the lightbox.
//    (#1 storage: cap + compress the original instead of saving it untouched.)
const ORIGINAL_MAX_DIM = 2000;

// ── Watermark ─────────────────────────────────────────────────────────────────
// A text watermark (horizontally centred, 20% above the bottom edge) is BAKED
// into the original, medium and thumb images. Because it's composited into the pixels,
// it appears everywhere the photo is shown (home, matches/listing, profile
// details, gallery, lightbox) and can't be removed via devtools or by opening
// the raw file URL. Opacity 0.2 per requirement.
const WATERMARK_TEXT    = 'Verified Profile on TeluguSambandham.com';
const WATERMARK_OPACITY = 0.2;
// Vertical centre of the watermark as a fraction of image height from the top
// (0.8 = 20% of the height above the bottom edge). Horizontal stays centred.
const WATERMARK_CENTER_Y = 0.8;

// ── Embedded watermark font (fixes the ".notdef box per character" bug) ───────
// The backend Docker image is node:22-alpine and ships NO fonts, so the SVG
// font-family list resolved to nothing and librsvg drew a tofu box per glyph.
// To make rendering independent of any OS-installed font / fontconfig, we embed
// a real bold TTF directly into the SVG via an @font-face base64 data URI. The
// file is read + base64-encoded ONCE at module load (not per image). __dirname
// keeps the path correct regardless of the process cwd.
const WM_FONT_PATH = path.join(__dirname, '..', 'assets', 'fonts', 'DejaVuSans-Bold.ttf');
let WM_FONT_DATA_URI = '';
try {
  const fontBuf = fs.readFileSync(WM_FONT_PATH);
  WM_FONT_DATA_URI = `data:font/ttf;base64,${fontBuf.toString('base64')}`;
} catch (err) {
  // If the font can't be read we fall back to the OS font list below; log once
  // so the cause of any boxed watermark is discoverable.
  console.error(`Watermark font not loaded (${WM_FONT_PATH}): ${err.message}`);
}

// Rendered vertical extent of the ROTATED watermark text around its centre point,
// in em (multiples of the font size). Defaults are values measured for the embedded
// font; ensureWatermarkMetrics() re-measures them once from the real renderer
// (alpha bounding box of the rotated text) so the bottom/top-edge clamp below uses
// what is actually drawn.
const WM_METRICS = { belowEm: 2.6, aboveEm: 2.6 };
let wmMetricsPromise = null;
const ensureWatermarkMetrics = () => {
  if (!wmMetricsPromise) {
    wmMetricsPromise = (async () => {
      const W = 2200, H = 4000, FS = Math.round(W / 22); // FS = 100px
      const svg = buildWatermarkSvg(W, H);
      const cy = parseFloat(svg.toString().match(/<text x="[^"]+" y="([^"]+)"/)[1]);
      const { data, info } = await sharp(svg).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      let y0 = Infinity, y1 = -1;
      for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
          if (data[(y * info.width + x) * 4 + 3] > 0) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
        }
      }
      if (y1 > y0) {
        WM_METRICS.belowEm = (y1 + 1 - cy) / FS;
        WM_METRICS.aboveEm = (cy - y0) / FS;
      }
    })().catch(() => { /* keep defaults */ });
  }
  return wmMetricsPromise;
};

// Escape text for safe embedding inside the SVG overlay.
const escapeXml = (s) => s.replace(/[<>&'"]/g, (c) => (
  { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]
));

// Build an SVG, sized to the target image, with the watermark text centered and
// rotated slightly so it's harder to crop out. Font size scales with image width.
const buildWatermarkSvg = (width, height) => {
  const fontSize = Math.max(14, Math.round(width / 22)); // scales with image
  const text = escapeXml(WATERMARK_TEXT);
  const cx = width / 2;
  // Half-extent of the rotated text box (length = text advance, thickness ~1em).
  // Keep the centre at WATERMARK_CENTER_Y unless that would push the text past
  // the bottom edge; then move it up just enough to fit (same font size).
  const below = WM_METRICS.belowEm * fontSize + 2; // +2px stroke/AA margin
  const above = WM_METRICS.aboveEm * fontSize + 2;
  const cy = Math.max(Math.min(height * WATERMARK_CENTER_Y, height - below), Math.min(above, height / 2));
  const fontFace = WM_FONT_DATA_URI
    ? `@font-face { font-family: 'WMFont'; font-weight: 700;
                   src: url(${WM_FONT_DATA_URI}) format('truetype'); }`
    : '';
  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
       <style>
         ${fontFace}
         .wm { fill: #ffffff; fill-opacity: ${WATERMARK_OPACITY};
               font-family: 'WMFont', 'DejaVu Sans', 'Noto Sans', Arial, Helvetica, sans-serif; font-weight: 700;
               font-size: ${fontSize}px; paint-order: stroke;
               stroke: #000000; stroke-opacity: ${WATERMARK_OPACITY * 0.5};
               stroke-width: 1px; }
       </style>
       <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle"
             transform="rotate(-30 ${cx} ${cy})" class="wm">${text}</text>
     </svg>`
  );
};

// Resize + rotate an input buffer to the given fit, then composite the watermark
// (sized to the resulting image) and return a JPEG buffer at `quality`.
// Used for original, medium and thumb.
const renderWatermarked = async (buffer, resizeOpts, quality) => {
  await ensureWatermarkMetrics();
  // First pass: produce the resized image so we know its real dimensions.
  const resized = await sharp(buffer).rotate().resize(resizeOpts.width, resizeOpts.height, resizeOpts.options).toBuffer();
  const meta = await sharp(resized).metadata();
  const svg = buildWatermarkSvg(meta.width, meta.height);
  return sharp(resized)
    .composite([{ input: svg, gravity: 'center' }])
    .jpeg({ quality })
    .toBuffer();
};

// ── Main function: process one image into 3 sizes ─────────────────────────────
// Returns { original, medium, thumb } — all relative paths for DB storage.
//
// Optimizations (no functional change — still produces the same 3 files/paths):
//   #1  the original is dimension-capped + compressed + EXIF-stripped instead of
//       being written untouched (big storage win; visually equivalent).
//   #3  the three sizes are produced in parallel (Promise.all) instead of
//       sequentially — faster uploads, same output.
//   #5  .rotate() applies EXIF orientation so phone photos aren't sideways, and
//       on any partial failure the files written so far are cleaned up so no
//       orphan files are left on disk.
const processImage = async (base64Image, userId) => {
  ensureDir(UPLOAD_DIR);

  const buffer    = base64ToBuffer(base64Image);
  const timestamp = Date.now();
  const baseName  = `user_${userId}_${timestamp}`;

  // All processed outputs are JPEG — write them with a .jpg extension so the
  // filename matches the actual bytes (previously medium/thumb kept the source
  // extension, e.g. a *_medium.png that actually held JPEG data).
  const originalFilename = `${baseName}_original.jpg`;
  const mediumFilename   = `${baseName}_medium.jpg`;
  const thumbFilename    = `${baseName}_thumb.jpg`;

  const originalPath = path.join(UPLOAD_DIR, originalFilename);
  const mediumPath   = path.join(UPLOAD_DIR, mediumFilename);
  const thumbPath    = path.join(UPLOAD_DIR, thumbFilename);

  const paths = {
    original: `/uploads/gallery/${originalFilename}`,
    medium:   `/uploads/gallery/${mediumFilename}`,
    thumb:    `/uploads/gallery/${thumbFilename}`,
  };

  try {
    // Generate all three sizes concurrently, each with the baked-in watermark.
    const [originalBuf, mediumBuf, thumbBuf] = await Promise.all([
      // ── Original: capped to ORIGINAL_MAX_DIM, watermarked, high-quality JPEG ──
      renderWatermarked(
        buffer,
        { width: ORIGINAL_MAX_DIM, height: ORIGINAL_MAX_DIM, options: { fit: 'inside', withoutEnlargement: true } },
        85
      ),

      // ── Medium (600×800, fit inside, no crop), watermarked ─────────────────
      renderWatermarked(
        buffer,
        { width: SIZES.medium.width, height: SIZES.medium.height, options: { fit: 'inside', withoutEnlargement: true } },
        80
      ),

      // ── Thumb (300×300, cover crop — square), watermarked ──────────────────
      renderWatermarked(
        buffer,
        { width: SIZES.thumb.width, height: SIZES.thumb.height, options: { fit: 'cover', position: 'top' } },
        70
      ),
    ]);

    await Promise.all([
      fs.promises.writeFile(originalPath, originalBuf),
      fs.promises.writeFile(mediumPath, mediumBuf),
      fs.promises.writeFile(thumbPath, thumbBuf),
    ]);
  } catch (err) {
    // Partial-failure cleanup: remove whatever was written so we don't leave
    // orphaned files on disk when one of the three outputs fails.
    [originalPath, mediumPath, thumbPath].forEach((p) => {
      try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch (_) { /* best effort */ }
    });
    throw err;
  }

  return paths;
};

// ── Delete all 3 sizes for a gallery record ───────────────────────────────────
const deleteImageFiles = (imagepath, imagepath_medium, imagepath_thumb) => {
  [imagepath, imagepath_medium, imagepath_thumb].forEach(relPath => {
    if (!relPath) return;
    try {
      const fullPath = path.resolve(__dirname, '..', 'public', '.' + path.sep + String(relPath).replace(/^[/\\]+/, ''));
      // Only ever unlink files that live inside the gallery upload directory.
      if (!fullPath.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) {
        console.error(`Refusing to delete path outside gallery dir: ${relPath}`);
        return;
      }
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (err) {
      console.error(`Failed to delete file ${relPath}:`, err.message);
    }
  });
};

module.exports = {
  processImage,
  deleteImageFiles,
  // exported for the one-off re-watermark script (scripts/watermarkExisting.js)
  renderWatermarked,
  buildWatermarkSvg,
  ensureWatermarkMetrics,
  UPLOAD_DIR,
  ORIGINAL_MAX_DIM,
  SIZES,
};