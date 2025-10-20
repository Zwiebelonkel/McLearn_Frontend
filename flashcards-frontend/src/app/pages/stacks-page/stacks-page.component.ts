
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import { Stack } from '../../models';
import { AuthService } from '../../services/auth.service';
import { LoaderComponent } from '../../pages/loader/loader.component';
import { ToastService } from '../../services/toast.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LoaderComponent, TranslateModule],
  templateUrl: './stacks-page.component.html',
  styleUrls: ['./stacks-page.component.scss']
})
export class StacksPage {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  stacks = signal<Stack[]>([]);
  name = '';
  isPublic = false;
  userId = this.auth.getUserId();
  loading = signal(false);

  search: string = '';
  filter: 'all' | 'public' | 'own' | 'shared' = 'all';

  constructor() {
    this.load();
  }

  isLoggedIn(): boolean {
    return !!this.userId;
  }

  isOwner(stack: Stack): boolean {
    return stack.user_id === this.userId;
  }

  canEdit(stack: Stack): boolean {
    if (this.isOwner(stack)) {
      return true;
    }
    // On the stacks list, we don't have detailed collaborator info.
    // We assume that if a stack is private and not owned by the user,
    // but is visible in their list, they are a collaborator with edit rights.
    return !stack.is_public && !this.isOwner(stack);
  }

  get filteredStacks(): Stack[] {
    return this.stacks().filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(this.search.toLowerCase());
      if (!matchesSearch) {
        return false;
      }

      const isMine = s.user_id === this.userId;
      // A stack is shared if it's not public and not mine, as the API only sends stacks the user can see.
      const isSharedWithMe = !s.is_public && s.user_id !== this.userId;

      switch (this.filter) {
        case 'public':
          return s.is_public;
        case 'own':
          return isMine;
        case 'shared':
          return isSharedWithMe;
        default:
          return true;
      }
    });
  }

  load() {
    this.loading.set(true);
    this.api.stacks().subscribe(s => {
      // If logged in, the API returns all visible stacks (public, own, shared).
      // If not logged in, we must filter for public stacks only.
      this.stacks.set(this.isLoggedIn() ? s : s.filter(stack => stack.is_public));
      this.loading.set(false);
    });
  }

  create(e: Event) {
    e.preventDefault();
    this.loading.set(true);
    this.api.createStack(this.name, this.isPublic).subscribe({
      next: () => {
        this.toast.show('Stack created: ' + this.name, 'success');
        this.name = '';
        this.isPublic = false;
        this.load();
      },
      error: (err) => {
        console.error(err);
        this.toast.show('Failed to create stack', 'error');
      },
      complete: () => this.loading.set(false)
    });
  }

  remove(s: Stack) {
    if (confirm('Delete stack?')) {
      this.loading.set(true);
      this.api.deleteStack(s.id).subscribe({
        next: () => {
          this.toast.show('Stack deleted', 'success');
          this.load();
        },
        error: (err) => {
          console.error(err);
          this.toast.show('Failed to delete stack', 'error');
        },
        complete: () => this.loading.set(false)
      });
    }
  }
}
