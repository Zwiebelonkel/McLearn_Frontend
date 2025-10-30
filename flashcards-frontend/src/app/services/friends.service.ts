
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class FriendsService {
  http = inject(HttpClient);

  getFriends() {
    return this.http.get<User[]>('/api/friends');
  }

  getFriendRequests() {
    return this.http.get<User[]>('/api/friends/requests');
  }

  sendFriendRequest(username: string) {
    return this.http.post('/api/friends/requests', { username });
  }

  acceptFriendRequest(userId: number) {
    return this.http.put(`/api/friends/requests/${userId}`, {});
  }

  declineFriendRequest(userId: number) {
    return this.http.delete(`/api/friends/requests/${userId}`);
  }

  removeFriend(userId: number) {
    return this.http.delete(`/api/friends/${userId}`);
  }
}
