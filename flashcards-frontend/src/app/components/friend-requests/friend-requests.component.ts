import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FriendsService } from '../../services/friends.service';
import { FriendRequest } from '../../models';

@Component({
  selector: 'app-friend-requests',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './friend-requests.component.html',
  styleUrls: ['./friend-requests.component.scss'],
})
export class FriendRequestsComponent implements OnInit {
  friendsService = inject(FriendsService);
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
    this.friendsService.acceptFriendRequest(senderId).subscribe(() => {
      this.loadRequests();
    });
  }

  declineRequest(senderId: number) {
    this.friendsService.declineFriendRequest(senderId).subscribe(() => {
      this.loadRequests();
    });
  }
}
