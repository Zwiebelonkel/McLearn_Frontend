import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environments';
import { User } from '../models';
import { FriendRequest } from '../models';
import { Observable } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class FriendsService {
  private http = inject(HttpClient);

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'X-API-Key': environment.apiKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  // 👥 Freunde abrufen
  getFriends() {
    return this.http.get<User[]>(`${environment.apiBase}/friends`, {
      headers: this.getHeaders(),
    });
  }

  getFriendRequests() {
    return this.http.get<FriendRequest[]>(
      `${environment.apiBase}/friends/requests`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  // ➕ Freundschaftsanfrage senden
  sendFriendRequest(username: string) {
    return this.http.post(
      `${environment.apiBase}/friends/requests`,
      { username },
      { headers: this.getHeaders() }
    );
  }

  // ✅ Freundschaftsanfrage akzeptieren
  acceptFriendRequest(userId: number) {
    return this.http.put(
      `${environment.apiBase}/friends/requests/${userId}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // ❌ Freundschaftsanfrage ablehnen
  declineFriendRequest(userId: number) {
    return this.http.delete(
      `${environment.apiBase}/friends/requests/${userId}`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  getSentFriendRequests(): Observable<FriendRequest[]> {
    return this.http.get<FriendRequest[]>(`${environment.apiBase}/requests/sent`);
  }

  // 🗑️ Freund entfernen
  removeFriend(userId: number) {
    return this.http.delete(`${environment.apiBase}/friends/${userId}`, {
      headers: this.getHeaders(),
    });
  }
}
