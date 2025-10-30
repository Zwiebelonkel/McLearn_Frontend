import { Component } from '@angular/core';
import { FriendAddComponent } from '../../components/friend-add/friend-add.component';
import { FriendListComponent } from '../../components/friend-list/friend-list.component';
import { FriendRequestsComponent } from '../../components/friend-requests/friend-requests.component';

@Component({
  selector: 'app-friends-page',
  templateUrl: './friends-page.component.html',
  styleUrls: ['./friends-page.component.scss'],
  standalone: true,
  imports: [FriendListComponent, FriendRequestsComponent, FriendAddComponent],
})
export class FriendsPageComponent {

}
