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
  <a routerLink="/">← Zurück</a>
  <h2>Karten bearbeiten</h2>

  <form (submit)="add($event)">
    <input [(ngModel)]="front" name="front" placeholder="Vorderseite (Frage)" required />
    <input [(ngModel)]="back" name="back" placeholder="Rückseite (Antwort)" required />
    <button type="submit">Hinzufügen</button>
  </form>

  <div *ngFor="let c of cards()">
    <details>
      <summary><b>{{c.front}}</b> — {{c.back}} (Box {{c.box}})</summary>
      <label>Front: <input [(ngModel)]="c.front" name="f{{c.id}}"></label>
      <label>Back: <input [(ngModel)]="c.back"  name="b{{c.id}}"></label>
      <button (click)="save(c)">Speichern</button>
      <button (click)="del(c)">Löschen</button>
    </details>
  </div>
  `
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
  del(c: Card){ if(confirm('Karte löschen?')) this.api.deleteCard(c.id).subscribe(()=>this.reload()); }
}
