import { readFile } from 'node:fs/promises';

import { expect, test, unique } from './fixtures';

test.describe('opérations', () => {
  test('saisit, retrouve, modifie puis supprime une dépense', async ({ page }) => {
    const label = unique('Boulangerie e2e');
    await page.goto('/transactions');

    await page.getByRole('button', { name: 'Nouvelle opération' }).click();
    const drawer = page.getByRole('dialog');
    await drawer.getByLabel('Montant (€)').fill('12.40');
    await drawer.getByLabel('Compte').selectOption({ label: 'Compte courant' });
    await drawer.getByLabel('Catégorie').selectOption({ label: 'Courses' });
    await drawer.getByLabel('Libellé').fill(label);
    await drawer.getByRole('button', { name: 'Ajouter' }).click();
    await expect(drawer).toBeHidden();

    await page.getByPlaceholder('Libellé ou note…').fill(label);
    await expect(page).toHaveURL(/q=Boulangerie/);
    const row = page.locator('tr.is-clickable', { hasText: label });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('−12,40');

    await row.click();
    await drawer.getByLabel('Montant (€)').fill('15');
    await drawer.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(row).toContainText('−15,00');

    await row.click();
    await drawer.getByRole('button', { name: 'Supprimer' }).click();
    await drawer.getByRole('button', { name: 'Confirmer la suppression' }).click();
    await expect(row).toHaveCount(0);
  });

  test('refuse une saisie incomplète sans appeler l’API', async ({ page }) => {
    await page.goto('/transactions');
    await page.getByRole('button', { name: 'Nouvelle opération' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Ajouter' }).click();

    await expect(page.getByRole('dialog').locator('.field__error').first()).toBeVisible();
  });

  test('crée un virement visible des deux côtés', async ({ page }) => {
    const label = unique('Virement e2e');
    await page.goto('/transactions');
    await page.getByRole('button', { name: 'Nouvelle opération' }).click();
    const drawer = page.getByRole('dialog');
    await drawer.getByRole('radio', { name: 'Virement' }).click();
    await drawer.getByLabel('Montant (€)').fill('50');
    await drawer.getByLabel('Depuis le compte').selectOption({ label: 'Compte courant' });
    await drawer.getByLabel('Vers le compte').selectOption({ label: 'Espèces' });
    await drawer.getByLabel('Libellé').fill(label);
    await drawer.getByRole('button', { name: 'Ajouter' }).click();

    await page.getByPlaceholder('Libellé ou note…').fill(label);
    await expect(page.locator('tr.is-clickable', { hasText: label })).toHaveCount(2);
    const rows = page.locator('tr.is-clickable', { hasText: label });
    await expect(rows.filter({ hasText: 'Vers Espèces' })).toHaveCount(1);
    await expect(rows.filter({ hasText: 'Depuis Compte courant' })).toHaveCount(1);
  });

  test('filtre par type et période, avec des filtres partageables dans l’URL', async ({ page }) => {
    await page.goto('/transactions');
    await page.getByRole('radio', { name: 'Revenus' }).click();
    await page.getByRole('radio', { name: 'Mois dernier' }).click();

    await expect(page).toHaveURL(/kind=INCOME/);
    await expect(page).toHaveURL(/from=\d{4}-\d{2}-01/);
    const amounts = await page.locator('tbody .amount').allTextContents();
    expect(amounts.length).toBeGreaterThan(0);
    for (const amount of amounts) {
      expect(amount.trim()).toMatch(/^\+/);
    }

    await page.reload();
    await expect(page.getByRole('radio', { name: 'Revenus' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await page.getByRole('button', { name: 'Effacer les filtres' }).click();
    await expect(page).toHaveURL(/\/transactions$/);
  });

  test('exporte la sélection en CSV', async ({ page }) => {
    await page.goto('/transactions?q=Loyer');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exporter en CSV' }).click();
    const file = await download;

    expect(file.suggestedFilename()).toBe('operations-bilan.csv');
    const content = await readFile(await file.path(), 'utf8');
    expect(content).toContain('"Date";"Libellé";"Catégorie";"Compte";"Montant";"Note"');
    expect(content).toContain('Loyer — Résidence des Tilleuls');
  });
});
