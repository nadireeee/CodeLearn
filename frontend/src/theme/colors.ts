/* colors.ts – mavi-yeşil odaklı "ışık" teması + neon fütüristik "koyu" teması  */

/* Modern UI Colors - Tüm sistemi güncelleyen renkler */

export const Colors = {
  light: {
    /* ── Modern Brand Colors ─────────────────────────────── */
    primary: "#6366F1",           // Indigo
    primaryLight: "#818CF8",
    primaryDark: "#4F46E5",
    primaryGradient: ["#6366F1", "#8B5CF6"],

    secondary: "#10B981",         // Emerald
    secondaryLight: "#34D399",
    secondaryDark: "#059669",
    secondaryGradient: ["#10B981", "#06B6D4"],

    accent: "#F59E0B",           // Amber
    accentLight: "#FBBF24",
    accentDark: "#D97706",
    accentGradient: ["#F59E0B", "#EF4444"],

    /* ── Enhanced Status Colors ──────────────────────────── */
    success: "#10B981",
    successLight: "#D1FAE5",
    successDark: "#064E3B",
    successGradient: ["#10B981", "#34D399"],

    warning: "#F59E0B",
    warningLight: "#FEF3C7",
    warningDark: "#92400E",
    warningGradient: ["#F59E0B", "#FBBF24"],

    error: "#EF4444",
    errorLight: "#FEE2E2",
    errorDark: "#991B1B",
    errorGradient: ["#EF4444", "#F87171"],

    info: "#3B82F6",
    infoLight: "#DBEAFE",
    infoDark: "#1E40AF",
    infoGradient: ["#3B82F6", "#60A5FA"],

    /* ── Badge & Gamification Colors ─────────────────────── */
    badge: {
      common: "#94A3B8",
      uncommon: "#10B981",
      rare: "#3B82F6",
      epic: "#8B5CF6",
      legendary: "#F59E0B",
    },

    /* ── Quiz & Interactive Colors ───────────────────────── */
    quiz: {
      correct: "#10B981",
      incorrect: "#EF4444",
      selected: "#6366F1",
      timer: "#F59E0B",
      streak: "#8B5CF6",
      heart: "#EF4444",
    },

    /* ── Fun & Neon Colors ───────────────────────────────── */
    neon: "#00F5FF",
    neonPink: "#FF1493",
    neonGreen: "#00FF7F",
    neonPurple: "#BF00FF",
    neonBlue: "#0080FF",

    /* ── Modern Surfaces ─────────────────────────────────── */
    background: "#FFFFFF",
    backgroundSecondary: "#F8FAFC",
    backgroundTertiary: "#F1F5F9",
    backgroundQuaternary: "#E2E8F0",
    backgroundGradient: ["#FFFFFF", "#F8FAFC"],

    surface: "#FFFFFF",
    surfaceSecondary: "#F8FAFC",
    surfaceTertiary: "#F1F5F9",
    surfaceElevated: "#FFFFFF",
    surfaceGradient: ["#FFFFFF", "#F8FAFC"],

    /* ── Modern Text Colors ──────────────────────────────── */
    text: "#0F172A",
    textSecondary: "#475569",
    textTertiary: "#64748B",
    textQuaternary: "#94A3B8",
    textOnPrimary: "#FFFFFF",
    textOnSecondary: "#FFFFFF",
    textOnAccent: "#0F172A",
    textOnSurface: "#0F172A",

    /* ── Modern Borders ──────────────────────────────────── */
    border: "#E2E8F0",
    borderSecondary: "#CBD5E1",
    borderTertiary: "#F1F5F9",
    borderFocus: "#6366F1",
    borderError: "#EF4444",
    borderSuccess: "#10B981",

    /* ── Modern Effects ──────────────────────────────────── */
    shadow: "rgba(0, 0, 0, 0.1)",
    shadowMedium: "rgba(0, 0, 0, 0.15)",
    shadowLarge: "rgba(0, 0, 0, 0.2)",
    shadowXLarge: "rgba(0, 0, 0, 0.25)",
    shadowColored: "rgba(99, 102, 241, 0.25)",

    glass: "rgba(255, 255, 255, 0.8)",
    glassTint: "rgba(255, 255, 255, 0.1)",
    glassDark: "rgba(0, 0, 0, 0.1)",
    
    overlay: "rgba(0, 0, 0, 0.5)",
    overlayLight: "rgba(0, 0, 0, 0.25)",
    overlayDark: "rgba(0, 0, 0, 0.75)",
  },

  dark: {
    /* ── Modern Brand Colors (Dark Mode) ─────────────────── */
    primary: "#818CF8",
    primaryLight: "#A5B4FC",
    primaryDark: "#6366F1",
    primaryGradient: ["#818CF8", "#A78BFA"],

    secondary: "#34D399",
    secondaryLight: "#6EE7B7",
    secondaryDark: "#10B981",
    secondaryGradient: ["#34D399", "#22D3EE"],

    accent: "#FBBF24",
    accentLight: "#FCD34D",
    accentDark: "#F59E0B",
    accentGradient: ["#FBBF24", "#F87171"],

    /* ── Enhanced Status Colors (Dark Mode) ──────────────── */
    success: "#34D399",
    successLight: "#064E3B",
    successDark: "#D1FAE5",
    successGradient: ["#34D399", "#6EE7B7"],

    warning: "#FBBF24",
    warningLight: "#92400E",
    warningDark: "#FEF3C7",
    warningGradient: ["#FBBF24", "#FCD34D"],

    error: "#F87171",
    errorLight: "#991B1B",
    errorDark: "#FEE2E2",
    errorGradient: ["#F87171", "#FCA5A5"],

    info: "#60A5FA",
    infoLight: "#1E40AF",
    infoDark: "#DBEAFE",
    infoGradient: ["#60A5FA", "#93C5FD"],

    /* ── Badge & Gamification Colors (Dark Mode) ─────────── */
    badge: {
      common: "#64748B",
      uncommon: "#34D399",
      rare: "#60A5FA",
      epic: "#A78BFA",
      legendary: "#FBBF24",
    },

    /* ── Quiz & Interactive Colors (Dark Mode) ───────────── */
    quiz: {
      correct: "#34D399",
      incorrect: "#F87171",
      selected: "#818CF8",
      timer: "#FBBF24",
      streak: "#A78BFA",
      heart: "#F87171",
    },

    /* ── Fun & Neon Colors (Dark Mode) ───────────────────── */
    neon: "#00F5FF",
    neonPink: "#FF1493",
    neonGreen: "#00FF7F",
    neonPurple: "#BF00FF",
    neonBlue: "#0080FF",

    /* ── Modern Surfaces (Dark Mode) ─────────────────────── */
    background: "#0F172A",
    backgroundSecondary: "#1E293B",
    backgroundTertiary: "#334155",
    backgroundQuaternary: "#475569",
    backgroundGradient: ["#0F172A", "#1E293B"],

    surface: "#1E293B",
    surfaceSecondary: "#334155",
    surfaceTertiary: "#475569",
    surfaceElevated: "#334155",
    surfaceGradient: ["#1E293B", "#334155"],

    /* ── Modern Text Colors (Dark Mode) ──────────────────── */
    text: "#F8FAFC",
    textSecondary: "#CBD5E1",
    textTertiary: "#94A3B8",
    textQuaternary: "#64748B",
    textOnPrimary: "#0F172A",
    textOnSecondary: "#0F172A",
    textOnAccent: "#0F172A",
    textOnSurface: "#F8FAFC",

    /* ── Modern Borders (Dark Mode) ──────────────────────── */
    border: "#334155",
    borderSecondary: "#475569",
    borderTertiary: "#64748B",
    borderFocus: "#818CF8",
    borderError: "#F87171",
    borderSuccess: "#34D399",

    /* ── Modern Effects (Dark Mode) ──────────────────────── */
    shadow: "rgba(0, 0, 0, 0.3)",
    shadowMedium: "rgba(0, 0, 0, 0.4)",
    shadowLarge: "rgba(0, 0, 0, 0.5)",
    shadowXLarge: "rgba(0, 0, 0, 0.6)",
    shadowColored: "rgba(129, 140, 248, 0.3)",

    glass: "rgba(30, 41, 59, 0.8)",
    glassTint: "rgba(255, 255, 255, 0.1)",
    glassDark: "rgba(0, 0, 0, 0.3)",
    
    overlay: "rgba(0, 0, 0, 0.7)",
    overlayLight: "rgba(0, 0, 0, 0.4)",
    overlayDark: "rgba(0, 0, 0, 0.9)",
  },
};

/* ── Helpers ─────────────────────────────────────────────── */
export type ThemeColors = typeof Colors.light;
export type ColorScheme = "light" | "dark";
