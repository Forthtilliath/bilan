import { Component, computed, input } from '@angular/core';

/**
 * Icones au trait (grille 24, trait 1.75), dessinees pour l'application.
 * Les cles « categorie » sont stockees en base (colonne `categories.icon`).
 */
const PATHS = {
  // Navigation et interface
  dashboard: 'M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z',
  wallet: 'M4 7a2 2 0 0 1 2-2h11v4M4 7v11a2 2 0 0 0 2 2h14V9H6a2 2 0 0 1-2-2zM16 14.5h.01',
  list: 'M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4',
  tag: 'M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9zM7.5 7.5h.01',
  trending: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  'chevron-left': 'M15 18l-6-6 6-6',
  'chevron-right': 'M9 18l6-6-6-6',
  close: 'M18 6L6 18M6 6l12 12',
  pencil: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  download: 'M12 4v12M7 11l5 5 5-5M5 20h14',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
  refresh: 'M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4',
  'arrow-up': 'M7 17L17 7M8 7h9v9',
  'arrow-down': 'M7 7l10 10M17 8v9H8',
  transfer: 'M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4',
  check: 'M5 12l5 5L20 7',
  alert:
    'M12 9v4M12 17h.01M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  table: 'M4 5h16v14H4zM4 10h16M4 15h16M10 5v14',
  chart: 'M4 19V5M4 19h16M8 15l4-4 3 3 5-6',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  archive: 'M3 5h18v4H3zM5 9v10h14V9M10 13h4',
  // Categories
  home: 'M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6',
  cart: 'M3 4h2l2.4 11h11l2-8H6.2M8.5 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM17.5 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  utensils: 'M7 3v8a2 2 0 0 0 2 2v8M11 3v8a2 2 0 0 1-2 2M17 21V3c-2 1-3 3.5-3 7h3',
  train:
    'M6 4h12a1 1 0 0 1 1 1v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a1 1 0 0 1 1-1zM5 11h14M8 21l2-3M16 21l-2-3M9 14.5h.01M15 14.5h.01',
  car: 'M5 16v-5l2-5h10l2 5v5M3 11h18M5 16h14M5 16v2M19 16v2M7.5 13.5h.01M16.5 13.5h.01',
  ticket:
    'M4 7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4zM14 6v2M14 11v2M14 16v2',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  repeat: 'M17 3l3 3-3 3M4 11V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3M20 13v2a3 3 0 0 1-3 3H4',
  bag: 'M6 8h12l1 12H5zM9 8V6a3 3 0 0 1 6 0v2',
  gift: 'M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-1-3-5-3-5-1s5 1 5 1zM12 7c1-3 5-3 5-1s-5 1-5 1z',
  plane: 'M3 12.5l18-8.5-5.5 17-3.5-6.5zM12 14.5l9-10.5',
  book: 'M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10',
  coffee: 'M5 8h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3v2M12 3v2',
  dumbbell: 'M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12',
  zap: 'M13 3L5 14h6l-1 7 8-11h-6z',
  shield: 'M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z',
  phone: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2',
  briefcase: 'M4 8h16v11H4zM9 8V5h6v3M4 13h16',
  laptop: 'M5 6h14v9H5zM3 18h18',
  percent: 'M19 5L5 19M7 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
} as const;

export type IconName = keyof typeof PATHS;

/** Icones proposees pour une categorie (ordre du selecteur). */
export const CATEGORY_ICONS: readonly IconName[] = [
  'home',
  'cart',
  'utensils',
  'coffee',
  'train',
  'car',
  'plane',
  'ticket',
  'book',
  'dumbbell',
  'heart',
  'shield',
  'repeat',
  'phone',
  'zap',
  'bag',
  'gift',
  'briefcase',
  'laptop',
  'percent',
  'undo',
  'tag',
];

export function isIconName(name: string | null | undefined): name is IconName {
  return !!name && name in PATHS;
}

@Component({
  selector: 'app-icon',
  host: { class: 'icon', 'aria-hidden': 'true' },
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path [attr.d]="path()" />
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<string>();
  readonly size = input(18);

  protected readonly path = computed(() => {
    const name = this.name();
    return isIconName(name) ? PATHS[name] : PATHS.tag;
  });
}
