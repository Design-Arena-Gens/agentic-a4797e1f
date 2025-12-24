import type { Metadata } from "next";
import "./globals.css";
import { clsx } from "clsx";

export const metadata: Metadata = {
  title: "Sora 2 Video Studio",
  description:
    "Professional SaaS interface for crafting Sora 2 video generation prompts."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={clsx(
          "min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950",
          "text-slate-100 selection:bg-accent selection:text-white"
        )}
      >
        {children}
      </body>
    </html>
  );
}
