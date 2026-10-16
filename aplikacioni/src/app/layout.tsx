import type { Metadata, Viewport } from "next";
import { RegjistroPwa } from "@/components/RegjistroPwa";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "RideShare · Udhëtime për AAB",
    template: "%s · RideShare",
  },
  description: "Gjej udhëtime studentore drejt Kolegjit AAB.",
  applicationName: "RideShare",
  appleWebApp: { capable: true, title: "RideShare", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#123c35",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sq">
      <body>
        <RegjistroPwa />
        {children}
      </body>
    </html>
  );
}
