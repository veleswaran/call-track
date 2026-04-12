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
  
  try {
    // Fetch branding info with no-store to ensure it updates on every refresh
    const response = await fetch(`${baseUrl}/api/v1/branding`, {
      cache: 'no-store'
    });
    
    if (!response.ok) throw new Error();
    
    const data = await response.json();
    const sitename = data.app_sitename || "CallTrack AI Admin";

    return {
      title: sitename,
      description: "Enterprise call analytics admin console",
      manifest: "/manifest.json",
      appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: sitename,
      },
    };
  } catch (error) {
    return {
      title: "CallTrack AI Admin",
      description: "Enterprise call analytics admin console",
      manifest: "/manifest.json",
      appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "CallTrack AI",
      },
    };
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
