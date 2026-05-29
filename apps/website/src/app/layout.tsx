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
    process.env.NEXT_PUBLIC_APP_URL ?? "https://humanbetween.ai",
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
