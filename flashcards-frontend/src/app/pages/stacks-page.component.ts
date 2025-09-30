import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { FormsModule } from '@angular/forms';
import { Stack } from '../models';
import { AuthService } from '../services/auth.service';
import { LoaderComponent } from '../pages/loader/loader.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LoaderComponent],
  template: `
    <app-loader *ngIf="loading()" />
    <div *ngIf="!loading()">
      <div class="container">
        <h2 class="page-title">Stacks</h2>

        <form *ngIf="isLoggedIn()" (submit)="create($event)" class="add-form">
          <input [(ngModel)]="name" name="name" placeholder="New Stack" required class="form-input" />
          <button type="submit" class="btn btn-primary">Create</button>
        </form>

        <div class="filter-controls">
  <input
    type="text"
    [(ngModel)]="search"           <!-- ❌ kein () -->
    placeholder="🔍 Search stacks..."
    class="form-input"
  />

  <select [(ngModel)]="filter" class="form-input">
    <option value="all">All</option>
    <option value="public">🌍 Public only</option>
    <option value="own">🔒 My stacks</option>
  </select>
</div>

        <ul class="stack-list">
          <li *ngFor="let s of filteredStacks()" class="stack-item">
            <span class="stack-name">
              {{ s.name }}
              <span *ngIf="s.is_public && !isOwner(s) && s.owner_name">🌍 by {{s.owner_name}}</span>
              <span *ngIf="s.is_public && isOwner(s)">🌍</span>
              <span *ngIf="!s.is_public && isLoggedIn()">🔒</span>
            </span>
            <div class="stack-actions">
              <a *ngIf="isOwner(s)" [routerLink]="['/stack', s.id, 'edit']" class="btn btn-secondary">Edit</a>
              <a [routerLink]="['/stack', s.id, 'study']" class="btn btn-success">Study</a>
              <button *ngIf="isOwner(s)" (click)="remove(s)" class="btn btn-danger">Delete</button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    .page-title {
      margin-bottom: 2rem;
    }

    .add-form {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      align-items: center;
      border: 1px solid #d5d5d5;
      padding: 1rem;
      border-radius: 0.3rem;
    }

    .form-input {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    .filter-controls {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .filter-controls .form-input {
      flex: 1;
      min-width: 200px;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      text-align: center;
    }

    .btn-primary {
      background-color: var(--primary-color);
      color: white;
    }

    .btn-secondary {
      background-color: var(--secondary-color);
      color: white;
    }

    .btn-success {
      background-color: var(--success-color);
      color: white;
    }

    .btn-danger {
      background-color: var(--danger-color);
      color: white;
    }

    .stack-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .stack-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .stack-name {
      font-weight: bold;
    }

    .stack-actions {
      display: flex;
      gap: 1rem;
    }

    @media (max-width: 768px) {
      .add-form {
        flex-direction: column;
        align-items: stretch;
      }

      .add-form > .btn {
        align-self: flex-start;
      }

      .stack-item {
        flex-direction: column;
        align-items: stretch;
      }

      .stack-actions {
        margin-top: 1rem;
        justify-content: space-between;
      }
    }

    @media (max-width: 576px) {
      .container {
        padding: 1rem;
      }
    }
  `]
})
export class StacksPage {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  stacks = signal<Stack[]>([]);
  name = '';
  isPublic = false;
  userId = this.auth.getUserId();
  loading = signal(false);

  // 🟢 einfache Variablen statt Signals für Filter/Search
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

  // jetzt einfach als Getter
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
      this.stacks.set(this.isLoggedIn() ? s : s.filter(st => st.is_public));
      this.loading.set(false);
    });
  }

  create(e: Event) {
    e.preventDefault();
    this.loading.set(true);
    this.api.createStack(this.name, this.isPublic).subscribe(() => {
      this.name = '';
      this.isPublic = false;
      this.load();
    });
  }

  remove(s: Stack) {
    if (confirm('Delete stack?')) {
      this.loading.set(true);
      this.api.deleteStack(s.id).subscribe(() => this.load());
    }
  }
}
}