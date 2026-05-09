import { fireKakiTokens } from "./index";

const light = fireKakiTokens.colors.light;

export const nativeFonts = fireKakiTokens.typography.native;

export const nativeEmergencyTones = fireKakiTokens.emergency;
export const nativeStatusTones = fireKakiTokens.status;

export const colors = {
  light: {
    text: light.foreground.hex,
    tint: light.primary.hex,

    background: light.background.hex,
    foreground: light.foreground.hex,

    card: light.card.hex,
    cardForeground: light.cardForeground.hex,

    primary: light.primary.hex,
    primaryForeground: light.primaryForeground.hex,

    secondary: light.secondary.hex,
    secondaryForeground: light.secondaryForeground.hex,

    muted: light.muted.hex,
    mutedForeground: light.mutedForeground.hex,

    accent: light.accent.hex,
    accentForeground: light.accentForeground.hex,

    destructive: light.destructive.hex,
    destructiveForeground: light.destructiveForeground.hex,

    success: light.success.hex,
    successForeground: light.successForeground.hex,

    warning: light.warning.hex,
    warningForeground: light.warningForeground.hex,

    info: light.info.hex,
    infoForeground: light.infoForeground.hex,

    border: light.border.hex,
    input: light.border.hex,
  },
  radius: fireKakiTokens.radius.native,
};

export type NativeColors = typeof colors;
export type NativeColorPalette = typeof colors.light;

export default colors;
