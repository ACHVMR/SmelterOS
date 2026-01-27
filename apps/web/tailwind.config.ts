import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        
        // ═══════════════════════════════════════════════════════════════════
        // SMELTEROS DESIGN SYSTEM (Official Logo-Derived Palette)
        // ═══════════════════════════════════════════════════════════════════
        
        // Foundry (Zinc Scale)
        "foundry": {
          DEFAULT: "#09090B",
          50: "#FAFAFA",
          100: "#F4F4F5",
          200: "#E4E4E7",
          300: "#D4D4D8",
          400: "#A1A1AA",
          500: "#71717A",
          600: "#52525B",
          700: "#3F3F46",
          800: "#27272A",
          900: "#18181B",
          950: "#09090B",
        },
        
        // Molten (Smelter Activities) - Orange/Gold
        "molten": {
          DEFAULT: "#FF4D00",
          base: "#FF4D00",
          highlight: "#FFB000",
          deep: "#E63900",
        },
        
        // System (OS Activities) - Teal/Green
        "system": {
          DEFAULT: "#00C2B2",
          teal: "#00C2B2",
          green: "#32CD32",
        },
        
        // Ingot Bronze (Muted/Secondary)
        "ingot": {
          DEFAULT: "#3D2B1F",
          base: "#3D2B1F",
          highlight: "#6B5344",
        },
        
        // Legacy colors (preserved for compatibility)
        obsidian: "#0A0A0A",
        "terminal-green": "#00FF41",
        "pure-white": "#FFFFFF",
        "cyber-gray": "#1F2937",
        "mc-primary": "#FF9900",
        "mc-secondary": "#00E5FF",
        "mc-bg-dark": "#121212",
        "mc-surface-dark": "#1E1E1E",
        "mc-border-dark": "#333333",
        "gov-primary": "#F59E0B",
        "gov-secondary": "#06B6D4",
        "gov-bg-dark": "#0F172A",
        "gov-panel-dark": "#1E293B",
        "guild-primary": "#f94f06",
        "guild-bg-dark": "#23150f",
        "guild-surface-dark": "#2f1e17",
        "guild-card-dark": "#1a110d",
        "guild-text-secondary": "#bcb39a",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
        display: ["var(--font-space-grotesk)", "var(--font-orbitron)", "sans-serif"],
        body: ["var(--font-inter)", "var(--font-rajdhani)", "sans-serif"],
        doto: ["Doto", "sans-serif"],
        chakra: ["Chakra Petch", "sans-serif"],
        rajdhani: ["Rajdhani", "sans-serif"],
        "space-grotesk": ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
        noto: ["Noto Sans", "sans-serif"],
        inter: ["var(--font-inter)", "Inter", "sans-serif"],
        jetbrains: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        // SmelterOS Glows
        "glow-molten": "0 0 24px rgba(255, 77, 0, 0.4)",
        "glow-molten-lg": "0 4px 32px rgba(255, 77, 0, 0.3)",
        "glow-system": "0 0 20px rgba(0, 194, 178, 0.4)",
        "glow-system-lg": "0 4px 32px rgba(0, 194, 178, 0.3)",
        "glow-switch-on": "0 0 4px rgba(50, 205, 50, 0.8), 0 0 12px rgba(50, 205, 50, 0.4)",
        "glow-critical": "0 0 24px rgba(230, 57, 0, 0.8)",
        // Legacy glows
        "glow-orange": "0 0 15px rgba(255, 153, 0, 0.3)",
        "glow-cyan": "0 0 10px rgba(0, 229, 255, 0.3)",
        "glow-amber": "0 0 20px rgba(245, 158, 11, 0.3)",
      },
      backgroundImage: {
        "molten-gradient": "linear-gradient(135deg, #FF4D00 0%, #FFB000 100%)",
        "system-gradient": "linear-gradient(135deg, #00C2B2 0%, #32CD32 100%)",
        "ingot-gradient": "linear-gradient(145deg, #4A3628 0%, #3D2B1F 100%)",
      },
      animation: {
        glitch: "glitch 1s linear infinite",
        scanline: "scanline 8s linear infinite",
        "molten-drip": "molten-drip 0.5s ease-out",
        "system-pulse": "system-pulse 2s ease-in-out infinite",
        "pulse-heat": "pulse-heat 1.5s ease-in-out infinite",
      },
      keyframes: {
        glitch: {
          "2%, 64%": { transform: "translate(2px,0) skew(0deg)" },
          "4%, 60%": { transform: "translate(-2px,0) skew(0deg)" },
          "62%": { transform: "translate(0,0) skew(5deg)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "molten-drip": {
          "0%": { opacity: "0", transform: "translateY(-20px)", filter: "brightness(1.5)" },
          "50%": { filter: "brightness(1.2)" },
          "100%": { opacity: "1", transform: "translateY(0)", filter: "brightness(1)" },
        },
        "system-pulse": {
          "0%, 100%": { boxShadow: "0 0 8px rgba(0, 194, 178, 0.4)" },
          "50%": { boxShadow: "0 0 20px rgba(0, 194, 178, 0.8)" },
        },
        "pulse-heat": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 8px rgba(230, 57, 0, 0.5)" },
          "50%": { opacity: "0.85", boxShadow: "0 0 24px rgba(230, 57, 0, 0.8)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

