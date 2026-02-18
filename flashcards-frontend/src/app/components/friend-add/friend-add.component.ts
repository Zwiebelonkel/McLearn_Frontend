import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { FriendsService } from '../../services/friends.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-friend-add',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
  templateUrl: './friend-add.component.html',
  styleUrls: ['./friend-add.component.scss'],
})
export class FriendAddComponent {
  friendsService = inject(FriendsService);
  toastService = inject(ToastService);
  username = '';

  sendRequest() {
    if (this.username.trim() !== '') {
      this.friendsService.sendFriendRequest(this.username).subscribe({
        next: () => {
          this.username = '';
          this.toastService.show('Friend request sent successfully!', 'success');
        },
        error: (err) => {
          this.toastService.show(`Error: ${err.error.message}`, 'error');
        },
      });
    }
  }
}
