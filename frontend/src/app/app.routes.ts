import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Bilan — tableau de bord',
    loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'comptes',
    title: 'Bilan — comptes',
    loadComponent: () => import('./features/accounts/accounts.page').then((m) => m.AccountsPage),
  },
  {
    path: 'comptes/:id',
    title: 'Bilan — compte',
    loadComponent: () =>
      import('./features/accounts/account-detail.page').then((m) => m.AccountDetailPage),
  },
  {
    path: 'transactions',
    title: 'Bilan — opérations',
    loadComponent: () =>
      import('./features/transactions/transactions.page').then((m) => m.TransactionsPage),
  },
  {
    path: 'categories',
    title: 'Bilan — catégories et budgets',
    loadComponent: () =>
      import('./features/categories/categories.page').then((m) => m.CategoriesPage),
  },
  {
    path: 'investissements',
    title: 'Bilan — investissements',
    loadComponent: () => import('./features/portfolio/portfolio.page').then((m) => m.PortfolioPage),
  },
  {
    path: 'investissements/:id',
    title: 'Bilan — titre',
    loadComponent: () => import('./features/portfolio/asset.page').then((m) => m.AssetPage),
  },
  { path: '**', redirectTo: '' },
];
