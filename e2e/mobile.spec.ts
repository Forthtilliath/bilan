import { expect, test } from './fixtures';

const PAGES = ['/', '/comptes', '/transactions', '/categories', '/investissements'];

test.describe('mobile', () => {
  for (const path of PAGES) {
    test(`${path} tient dans la largeur de l’écran`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('main .card').first()).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('la navigation reste accessible en haut de page', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Navigation principale' });

    await expect(nav).toBeVisible();
    await nav.getByRole('link', { name: 'Investissements' }).click();
    await expect(page).toHaveURL(/\/investissements$/);
    await expect(nav.getByRole('link', { name: 'Investissements' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('l’onglet actif reste visible dans la barre qui défile', async ({ page }) => {
    for (const path of ['/investissements', '/categories', '/transactions']) {
      await page.goto(path);
      const active = page.locator('.nav__link.is-active');
      await expect(active).toBeVisible();
      await expect
        .poll(async () => {
          const box = await active.boundingBox();
          const width = page.viewportSize()?.width ?? 0;
          return !!box && box.x >= 0 && box.x + box.width <= width;
        })
        .toBe(true);
    }
  });
});
