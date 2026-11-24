import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  SITE_NAME,
  LOCALE,
  DEFAULT_OG_IMAGE,
  absoluteUrl,
  ORGANIZATION_JSONLD,
  WEBSITE_JSONLD,
} from '../../seo/siteConfig';

// Per-page head tags. Data lives in src/seo/siteConfig.js (ROUTE_SEO).
const Seo = ({ title, description, path, noindex = false, image = DEFAULT_OG_IMAGE, jsonLd = [] }) => {
  const url = absoluteUrl(path);
  const blocks = [ORGANIZATION_JSONLD, WEBSITE_JSONLD, ...jsonLd];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      {!noindex && <link rel="canonical" href={url} />}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content={LOCALE} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {blocks.map((b, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(b)}</script>
      ))}
    </Helmet>
  );
};

export default Seo;
