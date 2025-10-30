import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FriendAddComponent } from '../../components/friend-add/friend-add.component';
import { FriendListComponent } from '../../components/friend-list/friend-list.component';
import { FriendRequestsComponent } from '../../components/friend-requests/friend-requests.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-friends-page',
  standalone: true,
  templateUrl: './friends-page.component.html',
  styleUrls: ['./friends-page.component.scss'],
  imports: [
    CommonModule,
    TranslateModule,
    FriendListComponent,
    FriendRequestsComponent,
    FriendAddComponent,
  ],
})
export class FriendsPageComponent {}
