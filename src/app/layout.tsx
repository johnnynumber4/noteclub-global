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

export const metadata: Metadata = {
  title: "Note Club Modern",
  description:
    "A modern music album sharing club - take turns sharing albums based on themes, in alphabetical order",
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
            <NavbarMui />
            <main>{children}</main>
            <Footer />
          </Providers>
        </MuiThemeProvider>
      </body>
    </html>
  );
}
