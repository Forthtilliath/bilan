import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import type {
  Account,
  AccountId,
  AccountRequest,
  ApiProblem,
  Category,
  CategoryId,
  CategoryRequest,
  Trade,
  TradeId,
  TradeRequest,
  Transaction,
  TransactionId,
  TransactionQuery,
  TransactionRequest,
  TransferId,
  TransferRequest,
} from './models';

/** Ecritures de l'API. Les lectures passent par `httpResource` dans les pages, avec les URL ci-dessous. */
@Injectable({ providedIn: 'root' })
export class BilanApi {
  private readonly http = inject(HttpClient);

  createAccount(request: AccountRequest): Observable<Account> {
    return this.http.post<Account>('/api/accounts', request);
  }

  updateAccount(id: AccountId, request: AccountRequest): Observable<Account> {
    return this.http.put<Account>(`/api/accounts/${id}`, request);
  }

  deleteAccount(id: AccountId): Observable<unknown> {
    return this.http.delete(`/api/accounts/${id}`);
  }

  createCategory(request: CategoryRequest): Observable<Category> {
    return this.http.post<Category>('/api/categories', request);
  }

  updateCategory(id: CategoryId, request: CategoryRequest): Observable<Category> {
    return this.http.put<Category>(`/api/categories/${id}`, request);
  }

  deleteCategory(id: CategoryId): Observable<unknown> {
    return this.http.delete(`/api/categories/${id}`);
  }

  createTransaction(request: TransactionRequest): Observable<Transaction> {
    return this.http.post<Transaction>('/api/transactions', request);
  }

  updateTransaction(id: TransactionId, request: TransactionRequest): Observable<Transaction> {
    return this.http.put<Transaction>(`/api/transactions/${id}`, request);
  }

  /** Supprimer une jambe de virement supprime le virement entier. */
  deleteTransaction(id: TransactionId): Observable<unknown> {
    return this.http.delete(`/api/transactions/${id}`);
  }

  createTransfer(request: TransferRequest): Observable<Transaction[]> {
    return this.http.post<Transaction[]>('/api/transfers', request);
  }

  updateTransfer(id: TransferId, request: TransferRequest): Observable<Transaction[]> {
    return this.http.put<Transaction[]>(`/api/transfers/${id}`, request);
  }

  createTrade(request: TradeRequest): Observable<Trade> {
    return this.http.post<Trade>('/api/trades', request);
  }

  deleteTrade(id: TradeId): Observable<unknown> {
    return this.http.delete(`/api/trades/${id}`);
  }

  resetDemo(): Observable<unknown> {
    return this.http.post('/api/demo/reset', null);
  }
}

/** URL de recherche des operations : seuls les criteres renseignes deviennent des parametres. */
export function transactionsUrl(query: TransactionQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined && value !== '' && value !== false) {
      params.set(key, String(value));
    }
  }
  const search = params.toString();
  return search ? `/api/transactions?${search}` : '/api/transactions';
}

/** Extrait le ProblemDetail d'une erreur HTTP, avec un message de repli lisible. */
export function toProblem(error: unknown): ApiProblem {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return { status: 0, detail: 'Serveur injoignable : le backend Spring Boot est-il démarré ?' };
    }
    const body = error.error as Partial<ApiProblem> | null;
    return {
      status: error.status,
      detail: body?.detail ?? error.message,
      ...(body?.errors ? { errors: body.errors } : {}),
    };
  }
  return { status: -1, detail: 'Erreur inattendue.' };
}
