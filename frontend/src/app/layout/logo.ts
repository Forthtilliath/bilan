import { Component } from '@angular/core';

/** Monogramme : trois barres montantes, la derniere en vert « solde positif ». */
@Component({
  selector: 'app-logo',
  host: { 'aria-hidden': 'true' },
  template: `
    <svg width="30" height="30" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="9" fill="var(--ink)" />
      <rect x="7" y="17" width="4.5" height="8" rx="1.5" fill="var(--on-ink)" />
      <rect x="13.75" y="12" width="4.5" height="13" rx="1.5" fill="var(--on-ink)" />
      <rect x="20.5" y="7" width="4.5" height="18" rx="1.5" fill="var(--series-3)" />
    </svg>
  `,
})
export class Logo {}
