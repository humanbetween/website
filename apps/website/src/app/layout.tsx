import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Human Between — AI prompts for creators",
    template: "%s · Human Between",
  },
  description:
    "A library of premium AI prompts for video, image and websites. Copy, paste, ship.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://humanprompts.ai",
  ),
  openGraph: {
    title: "Human Between — AI prompts for creators",
    description:
      "A library of premium AI prompts for video, image and websites.",
    url: "/",
    siteName: "Human Between",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Human Between — AI prompts for creators",
    description:
      "A library of premium AI prompts for video, image and websites.",
  },
  robots: { index: true, follow: true },
};

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://humanprompts.ai";

// Structured data helps Google understand the brand and can power a sitelinks
// search box. The sitelinks themselves are chosen by Google automatically.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: "Human Between",
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Human Between",
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#org` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground overflow-x-clip">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
