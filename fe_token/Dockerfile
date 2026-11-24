# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine
WORKDIR /app
RUN npm i -g serve
COPY --from=build /app/build ./build
EXPOSE 3000
# No "-s": build/serve.json (written by scripts/seo-postbuild.js) keeps the SPA
# fallback, and lets serve return the per-route SEO HTML (e.g. /contact-us).
CMD ["serve", "build", "-l", "3000"]