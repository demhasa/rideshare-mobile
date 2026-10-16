import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RideShare · Udhëtime për AAB",
    short_name: "RideShare",
    description: "Gjej udhëtime studentore drejt Kolegjit AAB.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7f4",
    theme_color: "#123c35",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
