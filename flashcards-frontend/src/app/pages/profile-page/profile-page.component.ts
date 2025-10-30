
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Stack } from '../../models';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';


@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent implements OnInit {
  stacks: Stack[] = [];
  userName: string | null = null;
  userEmail: string | null = null;
  profilePictureUrl: SafeUrl | null = null;

  constructor(
    private api: ApiService, 
    private auth: AuthService, 
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.userName = this.auth.getUsername();
    if (this.userName) {
      this.profilePictureUrl = this.sanitizer.bypassSecurityTrustUrl(`https://api.dicebear.com/8.x/avataaars/svg?seed=${this.userName}`);
    }
    this.loadStacks();
  }

  loadStacks(): void {
    this.api.stacks().subscribe(stacks => {
      const userId = this.auth.getUserId();
      this.stacks = stacks.filter(s => s.user_id === userId);
    });
  }
}
