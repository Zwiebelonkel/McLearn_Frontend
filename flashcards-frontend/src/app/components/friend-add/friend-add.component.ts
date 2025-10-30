import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { FriendsService } from '../../services/friends.service';

@Component({
  selector: 'app-friend-add',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
  templateUrl: './friend-add.component.html',
  styleUrls: ['./friend-add.component.scss'],
})
export class FriendAddComponent {
  friendsService = inject(FriendsService);
  username = '';

  sendRequest() {
    if (this.username.trim() !== '') {
      this.friendsService.sendFriendRequest(this.username).subscribe(() => {
        this.username = '';
      });
    }
  }
}
