import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { FriendsService } from '../../services/friends.service';
import { Stack, User } from '../../models';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '../../services/toast.service';
import { UserStatisticsComponent } from '../../components/user-stats/user-stats.component';
type FriendStatus = 'none' | 'pending' | 'friends';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, UserStatisticsComponent],
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
})
export class ProfilePageComponent implements OnInit {
  stacks: Stack[] = [];
  userName: string | null = null;
  profilePictureUrl: SafeUrl | null = null;
  isOtherUserProfile: boolean = false;
  viewedUserId: number | null = null;
  friendStatus: FriendStatus = 'none';
  isLoading: boolean = false;
  isLoggedIn: boolean = false;
  showStatistics = signal(false);

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private friendsService: FriendsService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const paramId = this.route.snapshot.paramMap.get('id');
    const currentUserId = this.auth.getUserId();
    
    this.isLoggedIn = !!currentUserId;
    
    if (paramId) {
      const idNum = Number(paramId);
      this.viewedUserId = idNum;
      this.isOtherUserProfile = idNum !== currentUserId;
      
      this.api.getUser(idNum).subscribe((user) => {
        this.userName = user.name;
        if (this.userName) {
          this.profilePictureUrl = this.sanitizer.bypassSecurityTrustUrl(
            `https://api.dicebear.com/8.x/avataaars/svg?seed=${this.userName}`
          );
        }
        this.loadStacksForUser(idNum);
        
        if (this.isLoggedIn && this.isOtherUserProfile) {
          this.checkFriendStatus();
        }
      });
    } else {
      this.isOtherUserProfile = false;
      this.viewedUserId = currentUserId;
      this.userName = this.auth.getUsername();
      if (this.userName) {
        this.profilePictureUrl = this.sanitizer.bypassSecurityTrustUrl(
          `https://api.dicebear.com/8.x/avataaars/svg?seed=${this.userName}`
        );
      }
      this.loadStacks();
    }
  }

  toggleStatistics() {
    this.showStatistics.update(v => !v);
  }

  loadStacks(): void {
    this.api.stacks().subscribe((stacks) => {
      const userId = this.auth.getUserId();
      this.stacks = stacks.filter((s) => s.user_id === userId);
    });
  }

  loadStacksForUser(userId: number): void {
    this.api.stacks().subscribe((stacks) => {
      if (this.isOtherUserProfile) {
        this.stacks = stacks.filter((s) => s.user_id === userId && s.is_public);
      } else {
        this.stacks = stacks.filter((s) => s.user_id === userId);
      }
    });
  }

  checkFriendStatus(): void {
    if (!this.isLoggedIn || !this.viewedUserId) {
      return;
    }

    this.friendsService.getFriends().subscribe({
      next: (friends) => {
        const isFriend = friends.some((friend) => friend.id === this.viewedUserId);
        if (isFriend) {
          this.friendStatus = 'friends';
          return;
        }

        this.friendsService.getFriendRequests().subscribe({
          next: (requests) => {
            const hasPendingRequest = requests.some(
              (req) => req.sender_id === this.viewedUserId
            );
            this.friendStatus = hasPendingRequest ? 'pending' : 'none';
          },
          error: (err) => {
            console.error('Error checking friend requests:', err);
            this.friendStatus = 'none';
          },
        });
      },
      error: (err) => {
        console.error('Error checking friends:', err);
        this.friendStatus = 'none';
      },
    });
  }

  sendFriendRequest(): void {
    if (!this.userName || this.isLoading) return;

    this.isLoading = true;
    this.friendsService.sendFriendRequest(this.userName).subscribe({
      next: () => {
        this.friendStatus = 'pending';
        this.toast.show(`Friend request sent to ${this.userName}`, 'success');
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error sending friend request:', err);
        this.toast.show('Failed to send friend request', 'error');
        this.isLoading = false;
      },
    });
  }
}