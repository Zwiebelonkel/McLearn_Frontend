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
  import { ApiService, CreateCardPayload } from '../../services/api.service';
  import { Card, Stack } from '../../models';
  import { LoaderComponent } from '../../pages/loader/loader.component';
  
  @Component({
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, LoaderComponent],
    templateUrl: './editor-page.component.html',
    styleUrls: ['./editor-page.component.scss']
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
  