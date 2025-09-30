import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environments';
import { Card, Stack } from '../models';

export type CreateCardPayload = Partial<Card> & { stack_id: string };
export type CreateStackPayload = { name: string; is_public?: boolean };

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'X-API-Key': environment.apiKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  // -------- STACKS --------
  getStack(id: string) {
    return this.http.get<Stack>(
      `${environment.apiBase}/stacks/${id}`,
      { headers: this.getHeaders() }
    );
  }

  stacks() {
    return this.http.get<Stack[]>(`${environment.apiBase}/stacks`, {
      headers: this.getHeaders(),
    });
  }

  createStack(name: string, isPublic: boolean) {
    return this.http.post<Stack>(
      `${environment.apiBase}/stacks`,
      { name, is_public: isPublic },
      { headers: this.getHeaders() }
    );
  }

  updateStack(id: string, name: string, isPublic?: boolean) {
    const payload: any = { name };
    if (typeof isPublic === 'boolean') payload.is_public = isPublic;

    return this.http.patch<Stack>(
      `${environment.apiBase}/stacks/${id}`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  deleteStack(id: string) {
    return this.http.delete(`${environment.apiBase}/stacks/${id}`, {
      headers: this.getHeaders(),
    });
  }

  // -------- CARDS --------
  cards(stackId: string) {
    return this.http.get<Card[]>(`${environment.apiBase}/cards`, {
      params: { stackId },
      headers: this.getHeaders(),
    });
  }

  createCard(payload: CreateCardPayload) {
    return this.http.post<Card>(`${environment.apiBase}/cards`, payload, {
      headers: this.getHeaders(),
    });
  }

  updateCard(id: string, payload: Partial<Card>) {
    return this.http.patch<Card>(`${environment.apiBase}/cards/${id}`, payload, {
      headers: this.getHeaders(),
    });
  }

  deleteCard(id: string) {
    return this.http.delete(`${environment.apiBase}/cards/${id}`, {
      headers: this.getHeaders(),
    });
  }

  // -------- STUDY --------
  nextCard(stackId: string) {
    return this.http.get<Card | null>(
      `${environment.apiBase}/stacks/${stackId}/study/next`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  review(stackId: string, cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') {
    return this.http.post<Card>(
      `${environment.apiBase}/stacks/${stackId}/cards/${cardId}/review`,
      { rating },
      { headers: this.getHeaders() }
    );
  }
}
