import { Component, inject } from '@angular/core';
import { FriendsService } from '../../services/friends.service';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-friend-add',
  imports: [TranslateModule, FormsModule],
  standalone: true,
  templateUrl: './friend-add.component.html',
  styleUrls: ['./friend-add.component.scss']
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
