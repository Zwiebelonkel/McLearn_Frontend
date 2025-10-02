import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import { Stack } from '../../models';
import { AuthService } from '../../services/auth.service';
import { LoaderComponent } from '../../pages/loader/loader.component';
import { ToastService } from '../../services/toast.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LoaderComponent],
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

  // ✅ einfache Variablen statt Signals
  search: string = '';
  filter: 'all' | 'public' | 'own' = 'all';

  constructor() {
    this.load();
  }

  isLoggedIn(): boolean {
    return !!this.userId;
  }

  isOwner(stack: Stack): boolean {
    return stack.user_id === this.userId;
  }

  get filteredStacks(): Stack[] {
    return this.stacks().filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(this.search.toLowerCase());
      const isMine = s.user_id === this.userId;

      switch (this.filter) {
        case 'public': return s.is_public && matchesSearch;
        case 'own': return isMine && matchesSearch;
        case 'all': default: return matchesSearch;
      }
    });
  }

  load() {
    this.loading.set(true);
    this.api.stacks().subscribe(s => {
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