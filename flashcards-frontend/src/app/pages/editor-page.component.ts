import { Component, inject, signal, ViewChild, ElementRef } from '@angular/core';
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
        <!-- MARKDOWN TOOLBAR -->
        <div class="markdown-toolbar">
          <button type="button" (click)="insert('bold')"><b>B</b></button>
          <button type="button" (click)="insert('italic')"><i>I</i></button>
          <button type="button" (click)="insert('code')">Code</button>
          <button type="button" (click)="insert('ul')">Liste</button>
        </div>

        <!-- TEXTAREA Front -->
        <textarea
          #frontArea
          [(ngModel)]="front"
          name="front"
          placeholder="Front (Question)"
          required
          class="form-textarea"
          rows="4">
        </textarea>

        <!-- TEXTAREA Back -->
        <textarea
          [(ngModel)]="back"
          name="back"
          placeholder="Back (Answer)"
          required
          class="form-textarea"
          rows="4">
        </textarea>

        <button type="submit" class="btn btn-primary">Add</button>
      </form>

      <div class="card-list">
        <div *ngFor="let c of cards()" class="card">
          <div class="card-header">
            <b>{{ c.front }}</b> — {{ c.back }} (Box {{ c.box }})
          </div>
          <div class="card-body">
            <label>Front:
              <textarea [(ngModel)]="c.front" name="f{{c.id}}" class="form-textarea" rows="3"></textarea>
            </label>
            <label>Back:
              <textarea [(ngModel)]="c.back" name="b{{c.id}}" class="form-textarea" rows="3"></textarea>
            </label>
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
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .form-textarea {
      width: 100%;
      padding: 0.5rem;
      font-family: inherit;
      font-size: 1rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      resize: vertical;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      align-self: flex-start;
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
      background-color: rgb(250, 250, 248);
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

    .markdown-toolbar {
      display: flex;
      gap: 0.5rem;
    }

    .markdown-toolbar button {
      padding: 0.25rem 0.5rem;
      border: 1px solid #ccc;
      background: #f7f7f7;
      cursor: pointer;
      border-radius: 4px;
      font-family: inherit;
    }

    .markdown-toolbar button:hover {
      background: #e0e0e0;
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

  @ViewChild('frontArea') frontArea!: ElementRef<HTMLTextAreaElement>;

  constructor() {
    this.reload();
  }

  reload() {
    this.api.cards(this.stackId).subscribe(cs => this.cards.set(cs));
  }

  add(e: Event) {
    e.preventDefault();
    const payload: CreateCardPayload = {
      stack_id: this.stackId,
      front: this.front,
      back: this.back
    };
    this.api.createCard(payload).subscribe(() => {
      this.front = '';
      this.back = '';
      this.reload();
    });
  }

  save(c: Card) {
    this.api.updateCard(c.id, { front: c.front, back: c.back }).subscribe(() => this.reload());
  }

  del(c: Card) {
    if (confirm('Delete card?')) {
      this.api.deleteCard(c.id).subscribe(() => this.reload());
    }
  }

  insert(type: 'bold' | 'italic' | 'code' | 'ul') {
    const textarea = this.frontArea.nativeElement;
    const { selectionStart, selectionEnd, value } = textarea;
    const selected = value.slice(selectionStart, selectionEnd);

    let inserted = '';
    switch (type) {
      case 'bold':
        inserted = `**${selected || 'fett'}**`;
        break;
      case 'italic':
        inserted = `*${selected || 'kursiv'}*`;
        break;
      case 'code':
        inserted = `\`${selected || 'code'}\``;
        break;
      case 'ul':
        inserted = selected
          ? selected.split('\n').map(line => `- ${line}`).join('\n')
          : '- ';
        break;
    }

    // Neuer Wert
    const newValue = value.slice(0, selectionStart) + inserted + value.slice(selectionEnd);
    this.front = newValue;

    // Cursor setzen
    setTimeout(() => {
      textarea.focus();
      const cursor = selectionStart + inserted.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }
}