import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environments';
import { Observable } from 'rxjs';
import { Card, Stack, StackCollaborator, User, StackStatistics, UserStatistics } from '../models';


export type CreateCardPayload = Partial<Card> & {
  stack_id: string;
  front_image?: string;
};
export type CreateStackPayload = { name: string; is_public?: boolean };

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'X-API-Key': environment.apiKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  // -------- STACKS --------
  getStack(id: string) {
    return this.http.get<Stack>(`${environment.apiBase}/stacks/${id}`, {
      headers: this.getHeaders(),
    });
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

  updateCard(id: string, payload: Partial<Card> & { front_image?: string }) {
    return this.http.patch<Card>(
      `${environment.apiBase}/cards/${id}`,
      payload,
      {
        headers: this.getHeaders(),
      }
    );
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

  review(
    stackId: string,
    cardId: string,
    rating: 'again' | 'hard' | 'good' | 'easy'
  ) {
    return this.http.post<Card>(
      `${environment.apiBase}/stacks/${stackId}/cards/${cardId}/review`,
      { rating },
      { headers: this.getHeaders() }
    );
  }

  // -------- USERS --------

  searchUsers(query: string) {
    return this.http.get<User[]>(`${environment.apiBase}/users/search`, {
      params: { query },
      headers: this.getHeaders(),
    });
  }

  getUser(userId: number) {
    return this.http.get<User>(`${environment.apiBase}/users/${userId}`, {
      headers: this.getHeaders(),
    });
  }

  // -------- COLLABORATORS --------

  getCollaborators(stackId: string) {
    return this.http.get<StackCollaborator[]>(
      `${environment.apiBase}/stacks/${stackId}/collaborators`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  addCollaborator(stackId: string, userId: number) {
    return this.http.post<StackCollaborator>(
      `${environment.apiBase}/stacks/${stackId}/collaborators`,
      { userId, can_edit: true },
      {
        headers: this.getHeaders(),
      }
    );
  }

  removeCollaborator(stackId: string, collaboratorId: string) {
    return this.http.delete(
      `${environment.apiBase}/stacks/${stackId}/collaborators/${collaboratorId}`,
      {
        headers: this.getHeaders(),
      }
    );
  }

// -------- SCRIBBLEPAD --------
getScribblePad() {
  return this.http.get<{
    id: string;
    user_id: number;
    content: string;
    updated_at: string;
  }>(`${environment.apiBase}/scribblepad`, {
    headers: this.getHeaders(),
  });
}

saveScribblePad(content: string) {
  return this.http.post<{
    id: string;
    user_id: number;
    content: string;
    updated_at: string;
  }>(
    `${environment.apiBase}/scribblepad`,
    { content },
    { headers: this.getHeaders() }
  );
}

getStackStatistics(stackId: string) {
  return this.http.get<StackStatistics>(
    `${environment.apiBase}/stacks/${stackId}/statistics`,
    {
      headers: this.getHeaders(),
    }
  );
}

getUserStatistics(userId: number): Observable<UserStatistics> {
  return this.http.get<UserStatistics>(`${environment.apiBase}/users/${userId}/statistics`);
}
  // -------- ADMIN --------
  
  // Get all users (admin only)
  adminGetUsers() {
    return this.http.get<Array<{
      id: number;
      username: string;
      role?: string;
      created_at?: string;
      stack_count: number;
      card_count: number;
    }>>(`${environment.apiBase}/admin/users`, {
      headers: this.getHeaders(),
    });
  }

  // Get all stacks (admin only)
  adminGetStacks() {
    return this.http.get<Array<{
      id: string;
      name: string;
      user_id: number;
      owner_name: string;
      is_public: boolean;
      card_amount: number;
      created_at: string;
      updated_at: string;
    }>>(`${environment.apiBase}/admin/stacks`, {
      headers: this.getHeaders(),
    });
  }

  // Delete user (admin only)
  adminDeleteUser(userId: number) {
    return this.http.delete(`${environment.apiBase}/admin/users/${userId}`, {
      headers: this.getHeaders(),
    });
  }

  // Delete stack (admin only)
  adminDeleteStack(stackId: string) {
    return this.http.delete(`${environment.apiBase}/admin/stacks/${stackId}`, {
      headers: this.getHeaders(),
    });
  }

  // Update stack visibility (admin only)
  adminUpdateStack(stackId: string, isPublic: boolean) {
    return this.http.patch(`${environment.apiBase}/admin/stacks/${stackId}`, 
      { is_public: isPublic },
      { headers: this.getHeaders() }
    );
  }

  // Transfer stack ownership (admin only)
  adminTransferStack(stackId: string, username: string) {
    return this.http.patch(`${environment.apiBase}/admin/stacks/${stackId}/transfer`,
      { username },
      { headers: this.getHeaders() }
    );
  }

  // Get admin statistics (admin only)
  adminGetStatistics() {
    return this.http.get<{
      total: {
        users: number;
        stacks: number;
        publicStacks: number;
        cards: number;
        reviews: number;
      };
      recent: {
        users: number;
        stacks: number;
        reviews: number;
      };
    }>(`${environment.apiBase}/admin/statistics`, {
      headers: this.getHeaders(),
    });
  }


}
