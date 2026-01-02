import type { HeadingColor } from '@/types/headings'

export interface HeadingColorConfig {
  label: string
  /** Tailwind classes for the text and border color */
  textClass: string
  borderClass: string
  /** Tailwind class for the color dot in the picker */
  dotClass: string
}

export const headingColorConfig: Record<HeadingColor, HeadingColorConfig> = {
  default: {
    label: 'Default',
    textClass: 'text-foreground',
    borderClass: 'border-foreground/60',
    dotClass: 'bg-foreground',
  },
  blue: {
    label: 'Blue',
    textClass: 'text-heading-blue',
    borderClass: 'border-heading-blue/60',
    dotClass: 'bg-heading-blue',
  },
  teal: {
    label: 'Teal',
    textClass: 'text-heading-teal',
    borderClass: 'border-heading-teal/60',
    dotClass: 'bg-heading-teal',
  },
  purple: {
    label: 'Purple',
    textClass: 'text-heading-purple',
    borderClass: 'border-heading-purple/60',
    dotClass: 'bg-heading-purple',
  },
  amber: {
    label: 'Amber',
    textClass: 'text-heading-amber',
    borderClass: 'border-heading-amber/60',
    dotClass: 'bg-heading-amber',
  },
  pink: {
    label: 'Pink',
    textClass: 'text-heading-pink',
    borderClass: 'border-heading-pink/60',
    dotClass: 'bg-heading-pink',
  },
  green: {
    label: 'Green',
    textClass: 'text-heading-green',
    borderClass: 'border-heading-green/60',
    dotClass: 'bg-heading-green',
  },
  red: {
    label: 'Red',
    textClass: 'text-heading-red',
    borderClass: 'border-heading-red/60',
    dotClass: 'bg-heading-red',
  },
}

/** All heading colors in display order for the color picker */
export const headingColors: HeadingColor[] = [
  'default',
  'blue',
  'teal',
  'purple',
  'amber',
  'pink',
  'green',
  'red',
]
