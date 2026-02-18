import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FriendsService } from '../../services/friends.service';
import { FriendRequest } from '../../models';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-friend-requests',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './friend-requests.component.html',
  styleUrls: ['./friend-requests.component.scss'],
})
export class FriendRequestsComponent implements OnInit {
  friendsService = inject(FriendsService);
  toastService = inject(ToastService);
  requests: FriendRequest[] = [];

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests() {
    this.friendsService.getFriendRequests().subscribe((requests) => {
      this.requests = requests;
    });
  }

  acceptRequest(senderId: number) {
    this.friendsService.acceptFriendRequest(senderId).subscribe({
      next: () => {
        this.loadRequests();
        this.toastService.show('Friend request accepted!', 'success');
      },
      error: (err) => {
        this.toastService.show(`Error: ${err.error.message}`, 'error');
      },
    });
  }

  declineRequest(senderId: number) {
    this.friendsService.declineFriendRequest(senderId).subscribe({
      next: () => {
        this.loadRequests();
        this.toastService.show('Friend request declined!', 'success');
      },
      error: (err) => {
        this.toastService.show(`Error: ${err.error.message}`, 'error');
      },
    });
  }
}
