/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#0037b0",
        "primary-container": "#1d4ed8",
        "on-primary": "#ffffff",
        "on-primary-container": "#cad3ff",
        "primary-fixed": "#dce1ff",
        "primary-fixed-dim": "#b7c4ff",
        "on-primary-fixed": "#001551",
        "on-primary-fixed-variant": "#0039b5",
        "inverse-primary": "#b7c4ff",
        
        "secondary": "#006398",
        "secondary-container": "#5bb8fe",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#00476e",
        "secondary-fixed": "#cce5ff",
        "secondary-fixed-dim": "#93ccff",
        "on-secondary-fixed": "#001d31",
        "on-secondary-fixed-variant": "#004b73",
        
        "tertiary": "#3d445a",
        "tertiary-container": "#545c72",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#cdd5ef",
        "tertiary-fixed": "#dae2fd",
        "tertiary-fixed-dim": "#bec6e0",
        
        "surface": "#f8f9ff",
        "background": "#f8f9ff",
        "surface-dim": "#cbdbf5",
        "surface-bright": "#f8f9ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff",
        "surface-container": "#e5eeff",
        "surface-container-high": "#dce9ff",
        "surface-container-highest": "#d3e4fe",
        "surface-variant": "#d3e4fe",
        "surface-tint": "#2151da",
        
        "on-surface": "#0b1c30",
        "on-surface-variant": "#434655",
        "on-background": "#0b1c30",
        "inverse-surface": "#213145",
        "inverse-on-surface": "#eaf1ff",
        
        "outline": "#747686",
        "outline-variant": "#c4c5d7",
        
        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",

        // Academic Status colors
        "kkm-tuntas": "#16A34A",
        "kkm-tuntas-bg": "#DCFCE7",
        "kkm-remedial": "#D97706",
        "kkm-remedial-bg": "#FEF3C7",
        "kkm-tidak": "#DC2626",
        "kkm-tidak-bg": "#FEE2E2",
      },
      fontFamily: {
        headline: ["'Plus Jakarta Sans'", "sans-serif"],
        body: ["'Plus Jakarta Sans'", "sans-serif"],
        data: ["'Inter'", "sans-serif"],
      },
      borderRadius: {
        'sm': '0.25rem',
        'DEFAULT': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.5rem',
        'full': '9999px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.03)',
        'elevated': '0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
        'modal': '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
      }
    },
  },
  plugins: [],
}
