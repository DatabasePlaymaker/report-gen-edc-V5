import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Palet neo-brutalist: satu warna aksen berani + hitam pekat.
        // Aksen memakai orange brand PT CSI supaya UI tetap "milik" perusahaan.
        brand: {
          orange: "#F58220",
          navy: "#25408F",
        },
        nb: {
          bg: "#FDF6E3",     // krem hangat, khas neo-brutalist
          yellow: "#FFD23F",
          pink: "#FF6B9D",
          cyan: "#4ECDC4",
          ink: "#111111",
        },
      },
      boxShadow: {
        // Hard shadow tanpa blur = ciri utama neo-brutalism
        nb: "6px 6px 0 0 #111111",
        "nb-sm": "3px 3px 0 0 #111111",
        "nb-lg": "10px 10px 0 0 #111111",
      },
      fontFamily: {
        display: ["ui-sans-serif", "system-ui", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
