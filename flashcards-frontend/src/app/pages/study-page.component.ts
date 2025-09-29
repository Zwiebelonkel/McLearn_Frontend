import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { Card } from '../models';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <a routerLink="/">← Zurück</a>
  <h2>Lernen</h2>

  <ng-container *ngIf="current(); else empty">
    <div class="card">
      <div class="front" *ngIf="!showBack()">{{ current()!.front }}</div>
      <div class="back"  *ngIf="showBack()">{{ current()!.back }}</div>
    </div>
    <button *ngIf="!showBack()" (click)="flip()">Antwort zeigen</button>

    <div *ngIf="showBack()" class="ratings">
      <button (click)="rate('again')">Again</button>
      <button (click)="rate('hard')">Hard</button>
      <button (click)="rate('good')">Good</button>
      <button (click)="rate('easy')">Easy</button>
    </div>
  </ng-container>

  <ng-template #empty>
    <p>Keine Karte gefunden. Lege Karten an oder warte, bis welche fällig sind.</p>
  </ng-template>
  `,
  styles: [`.card{padding:16px;border:1px solid #ddd;border-radius:8px;margin:12px 0;font-size:20px}`]
})
export class StudyPage {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  stackId = this.route.snapshot.paramMap.get('id')!;
  current = signal<Card | null>(null);
  showBack = signal(false);

  constructor(){ this.load(); }
  load(){ this.api.nextCard(this.stackId).subscribe(c => { this.current.set(c); this.showBack.set(false); }); }
  flip(){ this.showBack.set(true); }
  rate(r: 'again'|'hard'|'good'|'easy'){
    const id = this.current()?.id; if(!id) return;
    this.api.review(id, r).subscribe(()=> this.load());
  }
}