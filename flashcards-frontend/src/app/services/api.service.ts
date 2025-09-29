import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environments';
import { Card, Stack } from '../models';

export type CreateCardPayload = Partial<Card> & { stack_id: string };

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private headers = new HttpHeaders({ 'X-API-Key': environment.apiKey });

  stacks() { return this.http.get<Stack[]>(`${environment.apiBase}/stacks`, { headers: this.headers }); }
  createStack(name: string) { return this.http.post<Stack>(`${environment.apiBase}/stacks`, { name }, { headers: this.headers }); }
  updateStack(id: string, name: string) { return this.http.patch<Stack>(`${environment.apiBase}/stacks/${id}`, { name }, { headers: this.headers }); }
  deleteStack(id: string) { return this.http.delete(`${environment.apiBase}/stacks/${id}`, { headers: this.headers }); }

  cards(stackId: string) { return this.http.get<Card[]>(`${environment.apiBase}/cards`, { params: { stackId }, headers: this.headers }); }
  createCard(payload: CreateCardPayload) { return this.http.post<Card>(`${environment.apiBase}/cards`, payload, { headers: this.headers }); }
  updateCard(id: string, payload: Partial<Card>) { return this.http.patch<Card>(`${environment.apiBase}/cards/${id}`, payload, { headers: this.headers }); }
  deleteCard(id: string) { return this.http.delete(`${environment.apiBase}/cards/${id}`, { headers: this.headers }); }

  nextCard(stackId: string) { return this.http.get<Card | null>(`${environment.apiBase}/study/next`, { params: { stackId }, headers: this.headers }); }
  review(cardId: string, rating: 'again'|'hard'|'good'|'easy') {
    return this.http.post<Card>(`${environment.apiBase}/study/review`, { cardId, rating }, { headers: this.headers });
  }
}
