export const fireKakiTokens = {
  colors: {
    light: {
      background: { hsl: "30 20% 98%", hex: "#fbf9f6" },
      foreground: { hsl: "0 0% 12%", hex: "#1f1f1f" },
      border: { hsl: "30 10% 85%", hex: "#dad4cf" },
      card: { hsl: "0 0% 100%", hex: "#ffffff" },
      cardForeground: { hsl: "0 0% 12%", hex: "#1f1f1f" },
      primary: { hsl: "8 77% 45%", hex: "#cf3517" },
      primaryForeground: { hsl: "0 0% 100%", hex: "#ffffff" },
      secondary: { hsl: "30 90% 55%", hex: "#f29021" },
      secondaryForeground: { hsl: "0 0% 12%", hex: "#1f1f1f" },
      muted: { hsl: "210 20% 90%", hex: "#e0e6eb" },
      mutedForeground: { hsl: "210 20% 40%", hex: "#52667a" },
      accent: { hsl: "210 20% 30%", hex: "#3d4d5c" },
      accentForeground: { hsl: "0 0% 100%", hex: "#ffffff" },
      destructive: { hsl: "0 84% 60%", hex: "#ef4444" },
      destructiveForeground: { hsl: "0 0% 100%", hex: "#ffffff" },
      success: { hsl: "142 71% 45%", hex: "#22c55e" },
      successForeground: { hsl: "0 0% 100%", hex: "#ffffff" },
      warning: { hsl: "43 96% 56%", hex: "#facc15" },
      warningForeground: { hsl: "0 0% 12%", hex: "#1f1f1f" },
      info: { hsl: "217 91% 60%", hex: "#3b82f6" },
      infoForeground: { hsl: "0 0% 100%", hex: "#ffffff" },
    },
    dark: {
      background: { hsl: "0 0% 12%", hex: "#1f1f1f" },
      foreground: { hsl: "30 20% 98%", hex: "#fbf9f6" },
      border: { hsl: "0 0% 25%", hex: "#404040" },
      card: { hsl: "0 0% 15%", hex: "#262626" },
      cardForeground: { hsl: "30 20% 98%", hex: "#fbf9f6" },
      primary: { hsl: "8 77% 55%", hex: "#e3492b" },
      primaryForeground: { hsl: "0 0% 100%", hex: "#ffffff" },
      secondary: { hsl: "30 90% 50%", hex: "#f08a0b" },
      secondaryForeground: { hsl: "0 0% 12%", hex: "#1f1f1f" },
      muted: { hsl: "0 0% 25%", hex: "#404040" },
      mutedForeground: { hsl: "0 0% 70%", hex: "#b3b3b3" },
      accent: { hsl: "210 20% 40%", hex: "#52667a" },
      accentForeground: { hsl: "0 0% 100%", hex: "#ffffff" },
      destructive: { hsl: "0 62% 30%", hex: "#7c1d1d" },
      destructiveForeground: { hsl: "30 20% 98%", hex: "#fbf9f6" },
      success: { hsl: "142 70% 38%", hex: "#1ca04d" },
      successForeground: { hsl: "0 0% 100%", hex: "#ffffff" },
      warning: { hsl: "38 92% 50%", hex: "#f0a30a" },
      warningForeground: { hsl: "0 0% 12%", hex: "#1f1f1f" },
      info: { hsl: "217 91% 60%", hex: "#3b82f6" },
      infoForeground: { hsl: "0 0% 100%", hex: "#ffffff" },
    },
  },
  radius: {
    web: "0.5rem",
    native: 12,
  },
  typography: {
    web: {
      sans: "\"Plus Jakarta Sans\", var(--app-font-sans)",
      serif: "\"Instrument Serif\", var(--app-font-serif)",
      mono: "var(--app-font-mono)",
    },
    native: {
      serif: "InstrumentSerif_400Regular",
      sans: "PlusJakartaSans_400Regular",
      sansMedium: "PlusJakartaSans_500Medium",
      sansSemibold: "PlusJakartaSans_600SemiBold",
      sansBold: "PlusJakartaSans_700Bold",
    },
  },
  emergency: {
    major: {
      label: "Major emergency",
      color: "#cf3517",
      border: "#7a1d09",
    },
    minor: {
      label: "Minor SOS",
      color: "#f29021",
      border: "#92400e",
    },
  },
  status: {
    pending: { background: "#fef3c7", foreground: "#854d0e" },
    active: { background: "#fee2e2", foreground: "#991b1b" },
    verified: { background: "#dcfce7", foreground: "#166534" },
    resolved: { background: "#dbeafe", foreground: "#1e40af" },
    disabled: { background: "#e7e5e4", foreground: "#57534e" },
  },
} as const;

export type FireKakiTokens = typeof fireKakiTokens;
export type FireKakiColorMode = keyof FireKakiTokens["colors"];
export type FireKakiStatusTone = keyof FireKakiTokens["status"];
export type FireKakiEmergencyTone = keyof FireKakiTokens["emergency"];
