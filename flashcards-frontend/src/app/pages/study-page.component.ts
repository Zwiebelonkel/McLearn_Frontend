import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { Card } from '../models';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <a routerLink="/" class="back-link">← Back</a>
      <h2 class="page-title">Study</h2>

      <ng-container *ngIf="current(); else empty">
        <div class="card" [class.flipped]="showBack()" (click)="flip()">
          <div class="card-inner">
            <div class="card-front">
              <p>{{ current()!.front }}</p>
            </div>
            <div class="card-back">
              <p>{{ current()!.back }}</p>
            </div>
          </div>
        </div>

        <div *ngIf="showBack()" class="ratings">
          <button (click)="rate('again')" class="btn btn-danger">Again</button>
          <button (click)="rate('hard')" class="btn btn-warning">Hard</button>
          <button (click)="rate('good')" class="btn btn-success">Good</button>
          <button (click)="rate('easy')" class="btn btn-info">Easy</button>
        </div>
      </ng-container>

      <ng-template #empty>
        <p>No card found. Create cards or wait until some are due.</p>
      </ng-template>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
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
    .card {
      perspective: 1000px;
      width: 100%;
      height: 200px;
      margin-bottom: 2rem;
      cursor: pointer;
    }
    .card-inner {
      position: relative;
      width: 100%;
      height: 100%;
      text-align: center;
      transition: transform 0.6s;
      transform-style: preserve-3d;
      box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
    }
    .card.flipped .card-inner {
      transform: rotateY(180deg);
    }
    .card-front, .card-back {
      position: absolute;
      width: 100%;
      height: 100%;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      border-radius: 8px;
    }
    .card-front {
      background-color: var(--light-color);
      border: 1px solid #ccc;
    }
    .card-back {
      background-color: var(--light-color);
      border: 1px solid #ccc;
      transform: rotateY(180deg);
    }
    .ratings {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }
    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-danger {
      background-color: var(--danger-color);
      color: white;
    }
    .btn-warning {
      background-color: var(--warning-color);
      color: white;
    }
    .btn-success {
      background-color: var(--success-color);
      color: white;
    }
    .btn-info {
      background-color: var(--info-color);
      color: white;
    }
  `]
})
export class StudyPage {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  stackId = this.route.snapshot.paramMap.get('id')!;
  current = signal<Card | null>(null);
  showBack = signal(false);

  constructor(){ this.load(); }
  load(){ this.api.nextCard(this.stackId).subscribe(c => { this.current.set(c); this.showBack.set(false); }); }
  flip(){ this.showBack.set(!this.showBack()); }
  rate(r: 'again'|'hard'|'good'|'easy'){
    const id = this.current()?.id; if(!id) return;
    this.api.review(id, r).subscribe(()=> this.load());
  }
}
