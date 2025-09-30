import {
  Component,
  inject,
  signal,
  ViewChild,
  ElementRef
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, CreateCardPayload } from '../services/api.service';
import { Card, Stack } from '../models';
import { LoaderComponent } from '../pages/loader/loader.component';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoaderComponent],
  template: `<app-loader *ngIf="loading()" />
    <div *ngIf="!loading()" class="container">
  <a routerLink="/" class="back-link">← Back</a>
  <h2 class="page-title">Edit Cards</h2>

  <!-- Stack-Einstellungen -->
  <div class="stack-meta">
    <label>
      Name:
<input *ngIf="stack()" [(ngModel)]="stack()!.name" name="stackName" class="form-input" />
    </label>

<label class="toggle-switch">
  <input type="checkbox" [(ngModel)]="isPublic" />
  <span class="slider"></span>
  <span class="toggle-label">Öffentlich</span>
</label>

    <button (click)="saveStack()" class="btn btn-secondary">Stack speichern</button>
  </div>

  <!-- Karten-Hinzufügen -->
  <form (submit)="add($event)" class="add-form">
    <input
      type="text"
      [(ngModel)]="front"
      name="front"
      placeholder="Question"
      required
      class="form-input" />

    <!-- Markdown Toolbar (nur für Rückseite) -->
    <div class="markdown-toolbar">
      <button type="button" (click)="insert('bold')"><b>B</b></button>
      <button type="button" (click)="insert('italic')"><i>I</i></button>
      <button type="button" (click)="insert('code')">Code</button>
      <button type="button" (click)="insert('ul')">Liste</button>
    </div>

    <textarea
      #backArea
      [(ngModel)]="back"
      name="back"
      placeholder="Answer"
      required
      class="form-textarea"
      rows="4">
    </textarea>

    <button type="submit" class="btn btn-primary">Add</button>
  </form>

<!-- CSV-Import -->
<div class="csv-import">
  <label class="btn btn-secondary">
    CSV hochladen
    <input type="file" (change)="importCSV($event)" hidden accept=".csv" />
  </label>
</div>

  <!-- Karten-Liste -->
  <div class="card-list">
    <div *ngFor="let c of cards()" class="card">
      <div class="card-header">
        <b>{{ c.front }}</b> — {{ c.back }} (Box {{ c.box }})
      </div>
      <div class="card-body">
        <label>Front:
          <input [(ngModel)]="c.front" name="f{{c.id}}" class="form-input" />
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

    .markdown-toolbar {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
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

    .add-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
      border: 1px solid #d5d5d5;
      padding: 1rem;
      border-radius: 0.3rem;
    }

    .form-input,
    .form-textarea {
      width: 100%;
      padding: 0.5rem;
      font-family: inherit;
      font-size: 1rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-sizing: border-box;
    }

    .form-textarea {
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
      border-radius: 10px;
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

    .stack-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: center;
  flex-wrap: wrap;
  border: 1px solid #d5d5d5;
  padding: 1rem;
  border-radius: 0.3rem;
}
.stack-meta .form-input {
  min-width: 200px;
}

.toggle-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch .slider {
  position: relative;
  width: 40px;
  height: 20px;
  background-color: #ccc;
  border-radius: 20px;
  transition: 0.3s;
}

.toggle-switch .slider::before {
  content: "";
  position: absolute;
  width: 16px;
  height: 16px;
  left: 2px;
  top: 2px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
}

.toggle-switch input:checked + .slider {
  background-color: var(--primary-color);
}

.toggle-switch input:checked + .slider::before {
  transform: translateX(20px);
}

.toggle-switch .toggle-label {
  font-size: 0.9rem;
}
  `]
})
export class EditorPage {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  stackId = this.route.snapshot.paramMap.get('id')!;
  cards = signal<Card[]>([]);
  front = '';
  back = '';
  stack = signal<Stack | null>(null); // Signal für Stack
  isPublic = false;
  loading = signal(false);

  @ViewChild('backArea') backArea!: ElementRef<HTMLTextAreaElement>;

  constructor() {
    this.loading.set(true);
    this.api.getStack(this.stackId).subscribe(s => {
      this.stack.set(s);
      this.isPublic = s.is_public; // Public-Status vorbefüllen
      this.loading.set(false);
    });
    this.reload();
  }

  reload() {
    this.loading.set(true);
    this.api.cards(this.stackId).subscribe(cs => {
      this.cards.set(cs);
      this.loading.set(false);
    });
  }

  add(e: Event) {
    e.preventDefault();
    this.loading.set(true);
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

  saveStack() {
    const s = this.stack();
    if (!s) return;

    this.loading.set(true);
    this.api.updateStack(s.id, s.name, this.isPublic).subscribe(() => {
      alert('Stack gespeichert');
      this.loading.set(false);
    });
  }


  del(c: Card) {
    if (confirm('Delete card?')) {
      this.loading.set(true);
      this.api.deleteCard(c.id).subscribe(() => this.reload());
    }
  }

  save(c: Card) {
    this.loading.set(true);
    this.api.updateCard(c.id, { front: c.front, back: c.back }).subscribe(() => {
      this.loading.set(false);
    });
  }

  insert(type: 'bold' | 'italic' | 'code' | 'ul') {
    const textarea = this.backArea.nativeElement;
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

    const newValue = value.slice(0, selectionStart) + inserted + value.slice(selectionEnd);
    this.back = newValue;

    setTimeout(() => {
      textarea.focus();
      const cursor = selectionStart + inserted.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

importCSV(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  this.loading.set(true);

  const reader = new FileReader();
  reader.onload = () => {
    const text = reader.result as string;

    // 1. Zeilen splitten
    const lines = text.trim().split('\n');

    // 2. Header entfernen, falls vorhanden
    const startIndex = lines[0].toLowerCase().includes('front') ? 1 : 0;

    const cardsToCreate = lines.slice(startIndex).map(line => {
      const [front, back] = line.split(',').map(x => x.trim().replace(/^"|"$/g, ''));
      return { front, back };
    });

    // 3. Alle Karten nacheinander erstellen
    let completed = 0;
    for (const card of cardsToCreate) {
      this.api.createCard({
        stack_id: this.stackId,
        front: card.front,
        back: card.back
      }).subscribe({
        next: () => {
          completed++;
          if (completed === cardsToCreate.length) this.reload();
        },
        error: (err) => {
          console.error('Fehler beim Import:', err);
          this.loading.set(false);
        }
      });
    }
  };

  reader.readAsText(file);
}
}
