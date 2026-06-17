import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { TelegramProvider } from "@/lib/telegram-provider";
import Script from "next/script";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"], // Removed 300 to save slightly on font size
  display: 'swap',
});

export const metadata: Metadata = {
  title: "HazeeVPN",
  description: "Управляйте вашей подпиской HazeeVPN",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${montserrat.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <link rel="dns-prefetch" href="https://panel.hazeevpn.com" />
        <link rel="preconnect" href="https://panel.hazeevpn.com" crossOrigin="anonymous" />
        <link rel="prefetch" href="/cl.html" />
      </head>
      <body className="min-h-full flex flex-col bg-black">
          <TelegramProvider>
            {children}
          </TelegramProvider>
      </body>
    </html>
  );
}

