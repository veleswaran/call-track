import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "sonner/dist/styles.css";
import { Providers } from "@shared/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  
  const appleWebAppDefaults = {
    capable: true,
    statusBarStyle: "default" as const,
    title: "CallTrack AI",
  };

  const defaultMetadata: Metadata = {
    title: "CallTrack AI Admin",
    description: "Enterprise call analytics admin console",
    manifest: "/manifest.json",
    appleWebApp: appleWebAppDefaults,
  };

  if (!baseUrl) return defaultMetadata;

  try {
    const response = await fetch(`${baseUrl}/api/v1/branding`, {
      cache: 'no-store'
    });
    
    if (!response.ok) return defaultMetadata;
    
    const data = await response.json();
    const sitename = data.app_sitename || "CallTrack AI Admin";

    return {
      ...defaultMetadata,
      title: sitename,
      appleWebApp: {
        ...appleWebAppDefaults,
        title: sitename,
      },
    };
  } catch {
    return defaultMetadata;
  }
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
