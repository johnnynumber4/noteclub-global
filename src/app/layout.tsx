import type { Metadata } from "next";
import "./globals.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/roboto/900.css";
import { Providers } from "@/components/providers";
import { NavbarMui } from "@/components/navbar-mui";
import { Footer } from "@/components/footer";
import { TurnFAB } from "@/components/TurnFAB";
import MuiThemeProvider from "@/components/MuiThemeProvider";
import NotificationManager from "@/components/NotificationManager";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import "@/lib/sw-error-handler";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "NoteClub Modern",
  description:
    "Share and discover music albums with your friends in organized groups",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NoteClub",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "NoteClub",
    "msapplication-TileColor": "#f44336",
    "theme-color": "#f44336",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body>
        <MuiThemeProvider>
          <Providers session={session}>
            <NotificationManager />
            <PWAInstallPrompt />
            <NavbarMui />
            <TurnFAB />
            <main>{children}</main>
            <Footer />
          </Providers>
        </MuiThemeProvider>
      </body>
    </html>
  );
}
