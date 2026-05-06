import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  twitterCard?: 'summary' | 'summary_large_image';
}

export function SEO({
  title = "AG Sell — CRM com WhatsApp, E-mail, IA e Automação | Plataforma All-in-One",
  description = "AG Sell é a plataforma all-in-one que substitui HubSpot, ActiveCampaign, ManyChat, Intercom e ChatGPT. CRM, WhatsApp, e-mail marketing, agentes IA e automação integrados.",
  keywords = "CRM brasileiro, CRM com WhatsApp, automação de marketing, plataforma all-in-one, agentes IA vendas",
  canonical = "https://site.agsell.com.br/",
  ogImage = "https://site.agsell.com.br/og-image.png",
  ogType = "website",
  twitterCard = "summary_large_image",
}: SEOProps) {
  const siteName = "AG Sell";
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
