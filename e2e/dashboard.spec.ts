import { expect, test } from './fixtures';

test.describe('tableau de bord', () => {
  test('affiche le patrimoine, les flux du mois et les budgets', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Bilan — tableau de bord');
    await expect(page.locator('.hero-figure')).toHaveText(/^\d[\d\s]*\s€$/);
    await expect(page.locator('app-stat-tile')).toHaveCount(4);
    await expect(page.getByRole('heading', { name: 'Budgets du mois' })).toBeVisible();
    await expect(page.locator('app-accounts-summary li')).toHaveCount(5);
    await expect(page.locator('.recent li')).toHaveCount(6);
  });

  test('change de mois avec le sélecteur et avec un clic sur le graphique', async ({ page }) => {
    await page.goto('/');
    const label = page.locator('.month-picker__label');
    const before = await label.textContent();

    await page.getByRole('button', { name: 'Mois précédent' }).click();
    await expect(label).not.toHaveText(before ?? '');

    const columns = page.locator('app-cashflow-card .chart__hit--column');
    await columns.nth(2).click();
    await expect(page.locator('app-cashflow-card .chart__band--selected')).toHaveCount(1);
  });

  test('propose une vue tableau de chaque graphique', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('app-net-worth-card');

    await card.getByRole('button', { name: 'Afficher les données en tableau' }).click();
    await expect(card.locator('table tbody tr').first()).toBeVisible();
    await card.getByRole('button', { name: 'Afficher le graphique' }).click();
    await expect(card.locator('app-line-chart')).toBeVisible();
  });

  test('affiche une infobulle au survol et au clavier', async ({ page }) => {
    await page.goto('/');
    const hit = page.locator('app-net-worth-card .chart__hit');

    await hit.hover({ position: { x: 200, y: 60 } });
    await expect(page.locator('app-net-worth-card .chart-tooltip')).toBeVisible();
    await hit.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('app-net-worth-card .chart-tooltip__row')).toHaveCount(2);
  });

  test('ouvre les opérations d’une catégorie depuis la répartition des dépenses', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator('.spending__row').first().click();

    await expect(page).toHaveURL(/\/transactions\?.*kind=EXPENSE/);
    await expect(page.locator('app-transaction-table tr.is-clickable').first()).toBeVisible();
  });

  test('bascule en thème sombre et s’en souvient', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Thème sombre' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});
