/**
 * Anchor app theme - Monochrome design system
 * Core colors: #0f0f0f (dark) and #ffffff (light)
 */

import { Platform } from "react-native";

export const Colors = {
  light: {
    // Core
    background: "#ffffff",
    text: "#0f0f0f",
    // Variations
    textMuted: "#737373",
    border: "#e5e5e5",
    cardBg: "#fafafa",
    inputBorder: "#d4d4d4",
    // Tab bar
    tint: "#0f0f0f",
    icon: "#737373",
    tabIconDefault: "#737373",
    tabIconSelected: "#0f0f0f",
  },
  dark: {
    // Core
    background: "#0f0f0f",
    text: "#ffffff",
    // Variations
    textMuted: "#737373",
    border: "#262626",
    cardBg: "#171717",
    inputBorder: "#404040",
    // Tab bar
    tint: "#ffffff",
    icon: "#737373",
    tabIconDefault: "#737373",
    tabIconSelected: "#ffffff",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
