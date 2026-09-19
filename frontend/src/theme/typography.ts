// typography.ts
import { Platform, PixelRatio, StyleSheet, TextStyle } from 'react-native';

/* ─────────────── Ölçü Mantığı ──────────────── */

/** Temel font-size (px) */
const BASE_SIZE = 16;
/** Modüler ölçek oranı (Major Third ≈ 1.25)  */
const RATIO = 1.25;

/**
 * Belirtilen adım için modüler ölçek hesaplar
 * ve en yakın piksele yuvarlar.
 *
 * @example ms(2)  // ≈ 25 → 24 px
 */
const ms = (step: number) =>
  Math.round(PixelRatio.roundToNearestPixel(BASE_SIZE * Math.pow(RATIO, step)));

/* ─────────────── Font Ailesi & Ağırlık ──────────────── */

const FAMILY = {
  primary: Platform.select({
    ios: 'SF Pro Text',
    android: 'Roboto',
    default: 'System',
  })!,
  code: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  })!,
} as const;

const WEIGHT = {
  thin: '100',
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

/* ─────────────── Typography Scale ──────────────── */

export const Typography = StyleSheet.create({
  /* Başlıklar ────────────────── */
  h1: {
    fontSize: ms(3),                 // ≈ 32 px
    fontWeight: WEIGHT.extrabold,
    lineHeight: ms(3) * 1.2,         // %120
    letterSpacing: -0.5,
    fontFamily: FAMILY.primary,
  } as TextStyle,

  h2: {
    fontSize: ms(2),                 // ≈ 25 px
    fontWeight: WEIGHT.bold,
    lineHeight: ms(2) * 1.25,
    letterSpacing: -0.5,
    fontFamily: FAMILY.primary,
  } as TextStyle,

  h3: {
    fontSize: ms(1),                 // ≈ 20 px
    fontWeight: WEIGHT.semibold,
    lineHeight: ms(1) * 1.3,
    letterSpacing: -0.15,
    fontFamily: FAMILY.primary,
  } as TextStyle,

  h4: {
    fontSize: ms(0),                 // 16 px
    fontWeight: WEIGHT.semibold,
    lineHeight: ms(0) * 1.35,
    fontFamily: FAMILY.primary,
  } as TextStyle,

  h5: {
    fontSize: ms(-0.5),              // ≈ 14 px
    fontWeight: WEIGHT.medium,
    lineHeight: ms(-0.5) * 1.4,
    fontFamily: FAMILY.primary,
  } as TextStyle,

  /* Gövde Metni ──────────────── */
  body1: {
    fontSize: ms(0),
    fontWeight: WEIGHT.regular,
    lineHeight: ms(0) * 1.5,         // %150 ➜ okunabilir
    fontFamily: FAMILY.primary,
  } as TextStyle,

  body2: {
    fontSize: ms(-0.5),
    fontWeight: WEIGHT.regular,
    lineHeight: ms(-0.5) * 1.5,
    fontFamily: FAMILY.primary,
  } as TextStyle,

  caption: {
    fontSize: ms(-1),                // ≈ 11 px
    fontWeight: WEIGHT.light,
    lineHeight: ms(-1) * 1.5,
    fontFamily: FAMILY.primary,
  } as TextStyle,

  /* Button ───────────────────── */
  button: {
    fontSize: ms(0),
    fontWeight: WEIGHT.semibold,
    lineHeight: ms(0) * 1.25,
    textTransform: 'uppercase',
    letterSpacing: 0.75,
    fontFamily: FAMILY.primary,
  } as TextStyle,

  /* Kod Bloğu ────────────────── */
  code: {
    fontSize: ms(-0.25),
    fontWeight: WEIGHT.regular,
    lineHeight: ms(-0.25) * 1.5,
    fontFamily: FAMILY.code,
  } as TextStyle,
});

/* ─────────────── Tipler ──────────────── */
export type TypographyType = typeof Typography;
export type TypographyKey = keyof TypographyType;
