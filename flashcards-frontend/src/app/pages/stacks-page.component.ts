import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { FormsModule } from '@angular/forms';
import { Stack } from '../models';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="container">
      <h2 class="page-title">Stacks</h2>

      <form (submit)="create($event)" class="add-form">
        <input [(ngModel)]="name" name="name" placeholder="New Stack" required class="form-input" />

        <label class="form-checkbox">
          <input type="checkbox" [(ngModel)]="isPublic" name="isPublic" />
          Öffentlich
        </label>

        <button type="submit" class="btn btn-primary">Create</button>
      </form>

      <ul class="stack-list">
        <li *ngFor="let s of stacks()" class="stack-item">
          <span class="stack-name">
            {{ s.name }}
            <span *ngIf="s.is_public">🌍</span>
            <span *ngIf="!s.is_public">🔒</span>
          </span>
          <div class="stack-actions">
            <a [routerLink]="['/stack', s.id, 'edit']" class="btn btn-secondary">Edit</a>
            <a [routerLink]="['/stack', s.id, 'study']" class="btn btn-success">Study</a>
            <button (click)="remove(s)" class="btn btn-danger">Delete</button>
          </div>
        </li>
      </ul>
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
    }

    .form-input {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    .form-checkbox {
      display: flex;
      align-items: center;
      font-size: 0.9rem;
      gap: 0.3rem;
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
  stacks = signal<Stack[]>([]);
  name = '';
  isPublic = false;

  constructor() {
    this.load();
  }

  load() {
    this.api.stacks().subscribe(s => this.stacks.set(s));
  }

  create(e: Event) {
    e.preventDefault();
    this.api.createStack(this.name, this.isPublic).subscribe(() => {
      this.name = '';
      this.isPublic = false;
      this.load();
    });
  }

  remove(s: Stack) {
    if (confirm('Delete stack?')) {
      this.api.deleteStack(s.id).subscribe(() => this.load());
    }
  }
}
