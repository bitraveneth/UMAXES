import type { Metadata, Viewport } from "next";
import { Lora, Poppins } from "next/font/google";
import Providers from "@/components/Providers";
import { siteSlogan } from "@/lib/assets";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: `UMAXES — ${siteSlogan}`,
  description: `${siteSlogan}. HOOKAMAX adult vape experience for 21+. Nicotine is an addictive chemical.`,
  openGraph: {
    title: `UMAXES — ${siteSlogan}`,
    description: `${siteSlogan}. HOOKAMAX for adults 21+.`,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${poppins.variable} ${lora.variable}`}
    >
      <body className="flex min-h-dvh flex-col bg-umx-cream font-body text-black">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
