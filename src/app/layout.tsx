import type { Metadata, Viewport } from "next";
import { Lora, Poppins } from "next/font/google";
import Providers from "@/components/Providers";
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
  title: "UMAXES — One device. Done right.",
  description:
    "UMAXES single-product adult vape experience. For adults 21+. Nicotine is an addictive chemical.",
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
      className={`${poppins.variable} ${lora.variable}`}
    >
      <body className="flex min-h-dvh flex-col bg-umx-cream font-body text-black">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
