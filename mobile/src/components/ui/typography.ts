// components/ui/typography.ts — fixed type scale (M1 — Mobile Design Parity).
// Replaces scattered raw fontSize (10–40) across screens. Use via <Text variant=…>.

export type TypeVariant =
  | 'display' // screen hero / big numbers
  | 'title' // screen title
  | 'heading' // section heading
  | 'subheading' // card title
  | 'body' // default paragraph
  | 'bodyStrong'
  | 'label' // form label / small emphasis
  | 'caption' // secondary meta
  | 'micro'; // tiny badge / footnote

export interface TypeToken {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700';
}

export const TYPE_SCALE: Record<TypeVariant, TypeToken> = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '700' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  subheading: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: '600' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: '600' },
};
