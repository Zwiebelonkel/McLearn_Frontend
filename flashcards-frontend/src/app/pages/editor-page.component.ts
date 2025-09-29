import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, CreateCardPayload } from '../services/api.service';
import { Card } from '../models';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      <a routerLink="/" class="back-link">← Back</a>
      <h2 class="page-title">Edit Cards</h2>

      <form (submit)="add($event)" class="add-form">
        <input [(ngModel)]="front" name="front" placeholder="Front (Question)" required class="form-input" />
        <input [(ngModel)]="back" name="back" placeholder="Back (Answer)" required class="form-input" />
        <button type="submit" class="btn btn-primary">Add</button>
      </form>

      <div class="card-list">
        <div *ngFor="let c of cards()" class="card">
          <div class="card-header">
            <b>{{c.front}}</b> — {{c.back}} (Box {{c.box}})
          </div>
          <div class="card-body">
            <label>Front: <input [(ngModel)]="c.front" name="f{{c.id}}" class="form-input"></label>
            <label>Back: <input [(ngModel)]="c.back"  name="b{{c.id}}" class="form-input"></label>
          </div>
          <div class="card-footer">
            <button (click)="save(c)" class="btn btn-secondary">Save</button>
            <button (click)="del(c)" class="btn btn-danger">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    .back-link {
      text-decoration: none;
      color: var(--primary-color);
      margin-bottom: 1rem;
      display: inline-block;
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
    }
    .btn-primary {
      background-color: var(--primary-color);
      color: white;
    }
    .btn-secondary {
      background-color: var(--secondary-color);
      color: white;
    }
    .btn-danger {
      background-color: var(--danger-color);
      color: white;
    }
    .card-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }
    .card {
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    .card-header {
      padding: 1rem;
      background-color:rgb(250, 250, 248);
      border-bottom: 1px solid #ccc;
      border-radius: 9px 9px 0px 0px;
    }
    .card-body {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .card-footer {
      padding: 1rem;
      border-top: 1px solid #ccc;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }

    @media (max-width: 768px) {
      .add-form {
        flex-direction: column;
      }
      .add-form > .btn {
        align-self: flex-start;
      }
      .card-list {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 576px) {
      .container {
        padding: 1rem;
      }
    }
  `]
})
export class EditorPage {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  stackId = this.route.snapshot.paramMap.get('id')!;
  cards = signal<Card[]>([]);
  front = ''; back = '';

  constructor(){ this.reload(); }
  reload(){ this.api.cards(this.stackId).subscribe(cs => this.cards.set(cs)); }
  add(e: Event){
    e.preventDefault();
    const payload: CreateCardPayload = { stack_id: this.stackId, front: this.front, back: this.back };
    this.api.createCard(payload)
      .subscribe(()=>{ this.front=''; this.back=''; this.reload(); });
  }
  save(c: Card){ this.api.updateCard(c.id, { front: c.front, back: c.back }).subscribe(()=>this.reload()); }
  del(c: Card){ if(confirm('Delete card?')) this.api.deleteCard(c.id).subscribe(()=>this.reload()); }
}
