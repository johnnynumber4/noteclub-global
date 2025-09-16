import type { Metadata } from "next";
import "./globals.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/roboto/900.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { NavbarMui } from "@/components/navbar-mui";
import { Footer } from "@/components/footer";
import MuiThemeProvider from "@/components/MuiThemeProvider";
import AuthDebug from "@/components/AuthDebug";
import NotificationManager from "@/components/NotificationManager";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import "@/lib/sw-error-handler";

export const metadata: Metadata = {
  title: "Note Club Modern",
  description:
    "Share and discover music albums with your friends in organized groups",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Note Club",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Note Club",
    "msapplication-TileColor": "#f44336",
    "theme-color": "#f44336",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <MuiThemeProvider>
          <Providers>
            <NotificationManager />
            <PWAInstallPrompt />
            <NavbarMui />
            <main>{children}</main>
            <Footer />
          </Providers>
        </MuiThemeProvider>
      </body>
    </html>
  );
}
