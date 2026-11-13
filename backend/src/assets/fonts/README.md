# Watermark font

`DejaVuSans-Bold.ttf` is the bold sans-serif TrueType font embedded into the
image watermark SVG by `src/services/imageService.js` (via an `@font-face`
base64 data URI). Embedding the glyph data directly in the SVG makes watermark
rendering independent of any OS-installed font / fontconfig, which the
`node:22-alpine` backend image does not provide. Without a real glyph source,
librsvg draws a `.notdef` (tofu) box per character — this font fixes that.

- Font: DejaVu Sans Bold (DejaVu Fonts)
- License: Bitstream Vera / DejaVu license (permissive; redistribution allowed)
- Do not remove or rename without updating `WM_FONT_PATH` in `imageService.js`.
