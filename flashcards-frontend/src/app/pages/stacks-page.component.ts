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
        <button type="submit" class="btn btn-primary">Create</button>
      </form>

      <ul class="stack-list">
        <li *ngFor="let s of stacks()" class="stack-item">
          <span class="stack-name">{{s.name}}</span>
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
    }
    .form-input {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
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
  `]
})
export class StacksPage {
  private api = inject(ApiService);
  stacks = signal<Stack[]>([]);
  name = '';

  constructor(){ this.load(); }
  load(){ this.api.stacks().subscribe(s => this.stacks.set(s)); }
  create(e: Event){ e.preventDefault(); this.api.createStack(this.name).subscribe(()=>{ this.name=''; this.load(); }); }
  remove(s: Stack){ if(confirm('Delete stack?')) this.api.deleteStack(s.id).subscribe(()=>this.load()); }
}