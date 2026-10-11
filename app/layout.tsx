import type { Metadata, Viewport } from "next";
import { Barlow, Kaushan_Script, Oswald } from "next/font/google";
import "./globals.css";

const display = Oswald({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-display", display: "swap" });
const body = Barlow({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-body", display: "swap" });
const script = Kaushan_Script({ subsets: ["latin"], weight: "400", variable: "--font-script", display: "swap" });

export const metadata: Metadata = {
  title: "HÖPPERS · Beer Experience · Carta",
  description: "Carta de HÖPPERS Beer Experience: cervezas tiradas, cocktails, burgers, pizzetas y más.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#141413",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" className={`${display.variable} ${body.variable} ${script.variable}`}>
      <body>{children}</body>
    </html>
  );
}
