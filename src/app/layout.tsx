// © 2026 Riadh MNASRI

import type { Metadata, Viewport } from "next";
import { Lilita_One, Nunito } from "next/font/google";
import "./globals.css";

const lilita = Lilita_One({
  variable: "--font-lilita",
  weight: "400",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bonk Arena, le jeu de bagarre rigolo",
  description:
    "Jeu de combat 2D cartoon pour enfants : 4 combattants rigolos, coups spéciaux et finish humoristiques, à 1 joueur contre l'ordinateur ou à 2 sur le même clavier.",
};

export const viewport: Viewport = {
  themeColor: "#fff6e5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${lilita.variable} ${nunito.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
