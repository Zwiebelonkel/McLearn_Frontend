import { Component, OnInit, inject } from '@angular/core';
import { User } from '../../models';
import { FriendsService } from '../../services/friends.service';
import { TranslateModule } from '@ngx-translate/core';


@Component({
  selector: 'app-friend-list',
  imports: [TranslateModule],
  standalone: true,
  templateUrl: './friend-list.component.html',
  styleUrls: ['./friend-list.component.scss']
})
export class FriendListComponent implements OnInit {
  friendsService = inject(FriendsService);
  friends: User[] = [];

  ngOnInit(): void {
    this.loadFriends();
  }

  loadFriends() {
    this.friendsService.getFriends().subscribe(friends => {
      this.friends = friends;
    });
  }

  removeFriend(userId: number) {
    this.friendsService.removeFriend(userId).subscribe(() => {
      this.loadFriends();
    });
  }
}
