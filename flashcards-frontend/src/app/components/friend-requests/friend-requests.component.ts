import { Component, OnInit, inject } from '@angular/core';
import { User } from '../../models';
import { FriendsService } from '../../services/friends.service';
import { TranslateModule } from '@ngx-translate/core';


@Component({
  selector: 'app-friend-requests',
  imports: [TranslateModule],
  templateUrl: './friend-requests.component.html',
  styleUrls: ['./friend-requests.component.scss']
})
export class FriendRequestsComponent implements OnInit {
  friendsService = inject(FriendsService);
  requests: User[] = [];

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests() {
    this.friendsService.getFriendRequests().subscribe(requests => {
      this.requests = requests;
    });
  }

  acceptRequest(userId: number) {
    this.friendsService.acceptFriendRequest(userId).subscribe(() => {
      this.loadRequests();
    });
  }

  declineRequest(userId: number) {
    this.friendsService.declineFriendRequest(userId).subscribe(() => {
      this.loadRequests();
    });
  }
}
