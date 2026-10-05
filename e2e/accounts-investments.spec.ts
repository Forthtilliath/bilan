import { expect, test, unique } from './fixtures';

test.describe('comptes et catégories', () => {
  test('crée un compte, le consulte puis le supprime', async ({ page }) => {
    const name = unique('Livret e2e');
    await page.goto('/comptes');
    await page.getByRole('button', { name: 'Nouveau compte' }).click();
    const drawer = page.getByRole('dialog');
    await drawer.getByLabel('Nom du compte').fill(name);
    await drawer.getByLabel('Type').selectOption('SAVINGS');
    await drawer.getByLabel("Solde à l'ouverture (€)").fill('250');
    await drawer.getByRole('radio', { name: 'Couleur 6' }).click();
    await drawer.getByRole('button', { name: 'Créer le compte' }).click();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
    await expect(page.locator('app-stat-tile').first()).toContainText('250,00');

    await page.getByRole('button', { name: 'Modifier' }).click();
    await drawer.getByRole('button', { name: 'Supprimer' }).click();
    await drawer.getByRole('button', { name: /Supprimer avec ses 0 opérations/ }).click();
    await expect(page).toHaveURL(/\/comptes$/);
    await expect(page.getByText(name)).toHaveCount(0);
  });

  test('crée une catégorie de dépense avec un budget', async ({ page }) => {
    const name = unique('Animaux');
    await page.goto('/categories');
    await page.getByRole('button', { name: 'Catégorie de dépense' }).click();
    const drawer = page.getByRole('dialog');
    await drawer.getByLabel('Nom').fill(name);
    await drawer.getByLabel('Budget mensuel (€)').fill('40');
    await drawer.getByRole('radio', { name: 'heart' }).click();
    await drawer.getByRole('button', { name: 'Créer la catégorie' }).click();

    const row = page.locator('.category-row', { hasText: name });
    await expect(row).toContainText('40 € restants');
  });
});

test.describe('investissements', () => {
  test('affiche positions, répartition et performance', async ({ page }) => {
    await page.goto('/investissements');

    await expect(page.locator('app-stat-tile')).toHaveCount(4);
    await expect(page.locator('app-holdings-table tbody tr')).not.toHaveCount(0);
    await expect(page.locator('app-allocation-card')).toContainText('Liquidités');
    await page.getByRole('radio', { name: 'Portefeuille crypto' }).click();
    await expect(page).toHaveURL(/accountId=/);
    await expect(page.locator('app-holdings-table')).toContainText('BTC');
    await expect(page.locator('app-holdings-table')).not.toContainText('MNDE');
  });

  test('refuse une vente à découvert avec un message sous la quantité', async ({ page }) => {
    await page.goto('/investissements');
    await page.getByRole('button', { name: 'Passer un ordre' }).click();
    const drawer = page.getByRole('dialog');
    await drawer.getByRole('radio', { name: 'Vente' }).click();
    await drawer.getByLabel('Compte').selectOption({ label: 'PEA' });
    await drawer.getByLabel('Titre').selectOption({ label: 'MNDE — Monde Indiciel ETF' });
    await drawer.getByLabel('Quantité').fill('99999');
    await drawer.getByRole('button', { name: 'Enregistrer la vente' }).click();

    await expect(drawer.locator('.field__error')).toContainText('Position insuffisante');
  });

  test('achète une fraction de bitcoin puis la retrouve dans l’historique', async ({ page }) => {
    await page.goto('/investissements');
    await page.getByRole('button', { name: 'Passer un ordre' }).click();
    const drawer = page.getByRole('dialog');
    await drawer.getByLabel('Compte').selectOption({ label: 'Portefeuille crypto' });
    await drawer.getByLabel('Titre').selectOption({ label: 'BTC — Bitcoin' });
    await expect(drawer.getByLabel('Cours (€)')).not.toHaveValue('');
    await drawer.getByLabel('Quantité').fill('0.0001');
    await expect(drawer.locator('.trade-total')).toContainText('Montant débité');
    await drawer.getByRole('button', { name: "Enregistrer l'achat" }).click();
    await expect(drawer).toBeHidden();

    await expect(page.locator('app-trades-table tbody tr').first()).toContainText('0,0001');
  });

  test('ouvre la fiche d’un titre depuis les positions', async ({ page }) => {
    await page.goto('/investissements');
    await page.locator('app-holdings-table a').first().click();

    await expect(page).toHaveURL(/\/investissements\/[0-9a-f-]{36}$/);
    await expect(page.locator('app-line-chart')).toBeVisible();
    await page.getByRole('radio', { name: '3 mois' }).click();
    await expect(page.locator('app-chart-card')).toContainText('Variation sur la période');
  });
});
