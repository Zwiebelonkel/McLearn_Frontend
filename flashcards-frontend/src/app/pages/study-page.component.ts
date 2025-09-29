import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { Card } from '../models';

import { marked } from 'marked';
import DOMPurify from 'dompurify';

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
              <div [innerHTML]="renderMarkdown(current()?.front || '')"></div>
            </div>
            <div class="card-back">
              <div [innerHTML]="renderMarkdown(current()?.back || '')"></div>
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
      min-height: 250px;
      margin-bottom: 2rem;
      cursor: pointer;
      border: none;
      background-color: transparent;
    }
    .card-inner {
      position: relative;
      width: 100%;
      height: 100%;
      text-align: left;
      transition: transform 0.8s cubic-bezier(0.7, 0, 0.3, 1);
      transform-style: preserve-3d;
    }
    .card.flipped .card-inner {
      transform: rotateY(180deg);
    }
    .card-front, .card-back {
      position: absolute;
      width: 100%;
      min-height: 250px;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      padding: 1rem;
      font-size: 1rem;
      border-radius: 15px;
      color: var(--dark-color);
      background-color: var(--light-color);
      box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23);
    }
    .card-back {
      transform: rotateY(180deg);
    }
    /* Dark Theme Styles */
    :host-context(body.dark-theme) .card-front,
    :host-context(body.dark-theme) .card-back {
        background-color: #2d2d2d;
        color: var(--light-color);
        box-shadow: 0 10px 20px rgba(0,0,0,0.5), 0 6px 6px rgba(0,0,0,0.4);
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

    /* Optional Markdown Style */
    .card-front h1, .card-back h1 { font-size: 1.5rem; margin-top: 0; }
    .card-front ul, .card-back ul { padding-left: 1.2rem; }
    .card-front li, .card-back li { margin-bottom: 0.3rem; }
  `]
})
export class StudyPage {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  stackId = this.route.snapshot.paramMap.get('id')!;
  current = signal<Card | null>(null);
  showBack = signal(false);
  isTransitioning = signal(false);

  constructor() {
    this.loadCard();
  }

  renderMarkdown(text: string): string {
    return DOMPurify.sanitize(marked.parse(text || ''));
  }

  loadCard() {
    this.isTransitioning.set(true);
    this.api.nextCard(this.stackId).subscribe(card => {
      this.current.set(card);
      this.showBack.set(false);
      this.isTransitioning.set(false);
    });
  }

  flip() {
    if (this.isTransitioning()) {
      return;
    }
    this.showBack.set(!this.showBack());
  }

  rate(rating: 'again' | 'hard' | 'good' | 'easy') {
    if (this.isTransitioning()) {
      return;
    }
    const cardId = this.current()?.id;
    if (!cardId) {
      return;
    }

    this.isTransitioning.set(true);

    this.api.review(cardId, rating).subscribe(() => {
      this.showBack.set(false);
      setTimeout(() => {
        this.api.nextCard(this.stackId).subscribe(nextCard => {
          this.current.set(nextCard);
          this.isTransitioning.set(false);
        });
      }, 800);
    });
  }
}