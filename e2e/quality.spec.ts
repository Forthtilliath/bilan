import AxeBuilder from '@axe-core/playwright';

import { expect, test } from './fixtures';

const PAGES = ['/', '/comptes', '/transactions', '/categories', '/investissements'];

test.describe('accessibilité (axe, WCAG 2.1 AA)', () => {
  for (const scheme of ['light', 'dark'] as const) {
    for (const path of PAGES) {
      test(`${path} en thème ${scheme === 'light' ? 'clair' : 'sombre'}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto(path);
        await expect(page.locator('main .card').first()).toBeVisible();

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();
        const serious = results.violations
          .filter((v) => v.impact === 'serious' || v.impact === 'critical')
          .map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
        expect(serious).toEqual([]);
      });
    }
  }
});

test.describe('sécurité HTTP', () => {
  test('la page est servie avec une CSP stricte et des en-têtes défensifs', async ({ request }) => {
    const response = await request.get('/');
    const headers = response.headers();

    expect(headers['content-security-policy']).toContain("script-src 'self'");
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['server']).toBe('nginx');
  });

  test('les sondes internes ne sont pas exposées et l’API répond en ProblemDetail', async ({
    request,
  }) => {
    expect((await request.get('/actuator/health')).status()).toBe(404);

    const problem = await request.get('/api/accounts/00000000-0000-0000-0000-000000000000');
    expect(problem.status()).toBe(404);
    expect(problem.headers()['content-type']).toContain('application/problem+json');
    expect(await problem.json()).toMatchObject({
      detail: 'Compte introuvable.',
    });
    expect(JSON.stringify(await problem.json())).not.toMatch(/exception|trace|org\.spring/i);
  });

  test('le texte saisi est affiché, jamais interprété', async ({ page, request }) => {
    const accounts = (await (await request.get('/api/accounts')).json()) as {
      id: string;
      name: string;
    }[];
    const checking = accounts.find((a) => a.name === 'Compte courant');
    const label = '<img src=x onerror="window.__xss=1">';
    const created = await request.post('/api/transactions', {
      data: {
        accountId: checking?.id,
        bookedOn: new Date().toISOString().slice(0, 10),
        amount: -1,
        label,
      },
    });
    expect(created.status()).toBe(201);

    await page.goto('/transactions?q=onerror');
    await expect(page.getByText(label)).toBeVisible();
    expect(
      await page.evaluate(() => (window as unknown as { __xss?: number }).__xss),
    ).toBeUndefined();
    await request.delete(`/api/transactions/${((await created.json()) as { id: string }).id}`);
  });

  test('la remise à zéro de la démo est limitée dans le temps', async ({ request }) => {
    const first = await request.post('/api/demo/reset');
    const second = await request.post('/api/demo/reset');

    expect([204, 429]).toContain(first.status());
    expect(second.status()).toBe(429);
    expect(second.headers()['retry-after']).toBeDefined();
  });
});
