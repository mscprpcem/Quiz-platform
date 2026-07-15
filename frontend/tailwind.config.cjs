/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        brand: {
          blue: "#2563EB",
          lightBlue: "#EFF6FF",
          dark: "#1E3A8A",
          bgBody: "#F5FAFF",
          bgLight: "#F8FBFF",
          textMain: "#0F172A",
          textMuted: "#475569",
          border: "#E5F0FF",
          success: "#22C55E",
          error: "#EF4444",
          warning: "#F59E0B",
          cyan: "#0EA5E9",
          purple: "#8B5CF6",
        },
        social: {
          whatsapp: "#25D366",
          linkedin: "#0A66C2",
          instagram: "#DD2A7B",
          instagramOrange: "#F58529",
          instagramPurple: "#8134AF",
          github: "#111827",
          youtube: "#FF0000",
          linktree: "#39E09B",
          meetup: "#ED1C40",
        },
      },
      fontFamily: {
        segoe: ["'Inter'", "'Segoe UI'", "Tahoma", "Geneva", "Verdana", "sans-serif"],
        inter: ["'Inter'", "system-ui", "-apple-system", "sans-serif"]
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(15,23,42,0.08), 0 4px 16px -4px rgba(15,23,42,0.06)',
        'soft-lg': '0 4px 12px -2px rgba(15,23,42,0.08), 0 8px 24px -4px rgba(15,23,42,0.08)',
        'glow-blue': '0 0 20px rgba(37, 99, 235, 0.15), 0 0 40px rgba(37, 99, 235, 0.05)',
        'glow-blue-lg': '0 4px 14px rgba(37, 99, 235, 0.35), 0 0 30px rgba(37, 99, 235, 0.15)',
        'inner-soft': 'inset 0 2px 4px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
}
