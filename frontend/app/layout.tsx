import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import type { ReactNode } from "react";
import { THEME_KEY } from "@/lib/storage";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Medical Chatbot — RAG-powered health assistant",
    template: "%s · Medical Chatbot",
  },
  description: "Ask health questions and get clear answers grounded in a curated medical knowledge base.",
  applicationName: "Medical Chatbot",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1311" },
  ],
};

// Apply the saved theme before first paint to avoid a light/dark flash.
const themeScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;}catch(e){}})();`;

const RootLayout = ({ children }: Readonly<{ children: ReactNode }>) => (
  <html lang="en" className={`${inter.variable} ${manrope.variable}`} suppressHydrationWarning>
    <head>
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
    </head>
    <body>{children}</body>
  </html>
);

export default RootLayout;
