import { test as base, expect } from '@playwright/test';

/**
 * Chaque test echoue si la page emet une erreur JavaScript ou une violation CSP :
 * la politique de securite stricte de nginx ne doit rien casser.
 */
export const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        const text = message.text();
        // Les reponses 4xx attendues (validation) sont journalisees par le navigateur : on les ignore.
        if (message.type() === 'error' && !/status of 4\d\d/.test(text)) {
          errors.push(text);
        }
      });
      await use(errors);
      expect(errors, 'erreurs JavaScript ou violations CSP').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Libelle unique pour retrouver une saisie sans dependre des donnees de demo. */
export function unique(prefix: string): string {
  return `${prefix} ${Date.now().toString(36)}`;
}
