import { request } from '@playwright/test';

/** Repart de donnees de demo fraiches (meme histoire que la demo publique) avant toute la suite. */
export default async function globalSetup(): Promise<void> {
  const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:8089';
  const api = await request.newContext({ baseURL });
  const deadline = Date.now() + 120_000;
  // La pile peut encore demarrer : on attend que l'API reponde.
  while (
    !(await api
      .get('/api/accounts')
      .then((r) => r.ok())
      .catch(() => false))
  ) {
    if (Date.now() > deadline) {
      throw new Error(`API injoignable sur ${baseURL}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  const reset = await api.post('/api/demo/reset');
  // 429 : une remise a zero vient d'avoir lieu, les donnees sont deja fraiches.
  if (!reset.ok() && reset.status() !== 429) {
    throw new Error(`Remise a zero impossible : ${reset.status()}`);
  }
  await api.dispose();
}
