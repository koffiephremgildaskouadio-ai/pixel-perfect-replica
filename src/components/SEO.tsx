import { Helmet } from "react-helmet-async";

const SITE = "https://districtcitenovalim-cie.lovable.app";

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
}

export function SEO({ title, description, path = "/", image, type = "website" }: SEOProps) {
  const url = `${SITE}${path}`;
  const img = image ?? `${SITE}/icon-512.png`;
  const fullTitle = title.includes("Novalim") ? title : `${title} — District Cité Novalim-CIE`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />
    </Helmet>
  );
}
