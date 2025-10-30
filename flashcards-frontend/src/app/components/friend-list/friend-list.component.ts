import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FriendsService } from '../../services/friends.service';
import { User } from '../../models';

@Component({
  selector: 'app-friend-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './friend-list.component.html',
  styleUrls: ['./friend-list.component.scss'],
})
export class FriendListComponent implements OnInit {
  friendsService = inject(FriendsService);
  friends: User[] = [];

  ngOnInit(): void {
    this.loadFriends();
  }

  loadFriends() {
    this.friendsService.getFriends().subscribe((friends) => {
      this.friends = friends;
    });
  }

  removeFriend(userId: number) {
    this.friendsService.removeFriend(userId).subscribe(() => {
      this.loadFriends();
    });
  }
}
