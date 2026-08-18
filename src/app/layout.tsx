import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Layout } from "@/presentation/components/shared";
import { Toaster } from "sonner";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Gestor de Finanzas",
  description: "Aplicación para gestionar tus finanzas personales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${plusJakarta.variable} h-full antialiased`}
      style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif" }}
    >
      <body className="min-h-full">
        <Layout>{children}</Layout>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
