import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Limpieza con Trazabilidad JCI · Avante",
  description:
    "Sistema de Limpieza con Trazabilidad JCI — Avante Complejo Hospitalario (GO-PRY-001-2026)",
  applicationName: "Limpieza JCI",
};

// Mobile-first, one-handed, glove-friendly (spec §8 / §10.3).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1a2b4a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-SV" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
