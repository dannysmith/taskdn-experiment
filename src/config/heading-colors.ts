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
  gray: {
    label: 'Gray',
    textClass: 'text-heading-gray',
    borderClass: 'border-heading-gray',
    dotClass: 'bg-heading-gray',
  },
  blue: {
    label: 'Blue',
    textClass: 'text-heading-blue',
    borderClass: 'border-heading-blue',
    dotClass: 'bg-heading-blue',
  },
  teal: {
    label: 'Teal',
    textClass: 'text-heading-teal',
    borderClass: 'border-heading-teal',
    dotClass: 'bg-heading-teal',
  },
  purple: {
    label: 'Purple',
    textClass: 'text-heading-purple',
    borderClass: 'border-heading-purple',
    dotClass: 'bg-heading-purple',
  },
  amber: {
    label: 'Amber',
    textClass: 'text-heading-amber',
    borderClass: 'border-heading-amber',
    dotClass: 'bg-heading-amber',
  },
  pink: {
    label: 'Pink',
    textClass: 'text-heading-pink',
    borderClass: 'border-heading-pink',
    dotClass: 'bg-heading-pink',
  },
  green: {
    label: 'Green',
    textClass: 'text-heading-green',
    borderClass: 'border-heading-green',
    dotClass: 'bg-heading-green',
  },
  red: {
    label: 'Red',
    textClass: 'text-heading-red',
    borderClass: 'border-heading-red',
    dotClass: 'bg-heading-red',
  },
}

/** All heading colors in display order for the color picker */
export const headingColors: HeadingColor[] = [
  'gray',
  'blue',
  'teal',
  'purple',
  'amber',
  'pink',
  'green',
  'red',
]
