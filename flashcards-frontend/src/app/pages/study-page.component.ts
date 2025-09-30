import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { Card, Stack } from '../models';
import { AuthService } from '../services/auth.service';

// Markdown + Sanitize nur für Rückseite
import { marked } from 'marked';
import DOMPurify from 'dompurify';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  selector: 'app-study-page',
  template: `
    <div class="container">
      <a routerLink="/" class="back-link">← Back</a>
      <h2 class="page-title">Study</h2>

      <ng-container *ngIf="current(); else empty">
        <div class="card-wrapper">
          <div class="card" [class.flipped]="showBack()" (click)="flip()">
            <div class="card-inner">
              <!-- Vorderseite: Frage fett & zentriert -->
              <div class="card-front">
                <p>{{ current()?.front }}</p>
              </div>
              <!-- Rückseite: Markdown gerendert -->
              <div class="card-back">
                <div [innerHTML]="renderMarkdown(current()?.back || '')"></div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="showBack()">
          <div *ngIf="isOwner()" class="ratings">
            <button (click)="rate('again')" class="btn btn-danger">Again</button>
            <button (click)="rate('hard')" class="btn btn-warning">Hard</button>
            <button (click)="rate('good')" class="btn btn-success">Good</button>
            <button (click)="rate('easy')" class="btn btn-info">Easy</button>
          </div>
          <div *ngIf="!isOwner()">
            <button (click)="loadCard()" class="btn btn-primary">Next</button>
          </div>
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

    .card-wrapper {
      perspective: 1000px;
      width: 100%;
      max-width: 500px;
      margin: 0 auto 3rem;
    }

    .card {
      width: 100%;
      height: 300px;
      position: relative;
      transform-style: preserve-3d;
    }

    .card-inner {
      width: 100%;
      height: 100%;
      position: relative;
      transform-style: preserve-3d;
      transition: transform 0.5s cubic-bezier(0.7, 0, 0.3, 1);
      will-change: transform;
    }

    .card.flipped .card-inner {
      transform: rotateX(180deg);
    }

    .card-front,
    .card-back {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      padding: 1.5rem;
      border-radius: 15px;
      background-color: var(--light-color);
      color: var(--dark-color);
      box-shadow: 0 10px 20px rgba(0,0,0,0.19),
                  0 6px 6px rgba(0,0,0,0.23);
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
      font-size: 1.2rem;
      box-sizing: border-box;
      border: 5px solid;
      cursor: pointer;
      user-select: none;
    }

    .card-front {
      font-weight: bold;
    }

    .card-front p {
      margin: 0;
    }

    .card-back {
      transform: rotateX(180deg);
      justify-content: flex-start;
      align-items: flex-start;
      text-align: left;
      font-weight: normal;
      overflow-y: auto;
    }

    :host-context(body.dark-theme) .card-front,
    :host-context(body.dark-theme) .card-back {
      background-color: #2d2d2d;
      color: var(--light-color);
    }

    .ratings {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-top: 2.5rem;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.5rem 1.2rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-primary {
      background-color: var(--primary-color);
      color: white;
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

    /* Markdown Styling für Rückseite */
    .card-back h1 { font-size: 1.5rem; margin-top: 0; }
    .card-back ul { padding-left: 1.5rem; margin-top: 0.5rem; }
    .card-back li { margin-bottom: 0.3rem; }
    .card-back p { margin: 0.5rem 0; }
  `]
})
export class StudyPage {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  stackId = this.route.snapshot.paramMap.get('id')!;
  stack = signal<Stack | null>(null);
  current = signal<Card | null>(null);
  showBack = signal(false);
  isTransitioning = signal(false);
  userId = this.auth.getUserId();

  constructor() {
    this.loadCard();
    this.api.getStack(this.stackId).subscribe(stack => this.stack.set(stack));
  }

  isOwner(): boolean {
    return this.stack()?.user_id === this.userId;
  }

  renderMarkdown(text: string): string {
    return DOMPurify.sanitize(marked.parse(text || '') as string);
  }

  loadCard() {
    this.isTransitioning.set(true);
    this.showBack.set(false);
  
    setTimeout(() => {
      this.api.nextCard(this.stackId).subscribe(card => {
        this.current.set(card);
        this.isTransitioning.set(false);
      });
    }, 200);
  }
  

  flip() {
    if (this.isTransitioning()) return;
    this.showBack.set(!this.showBack());
  }

  rate(rating: 'again' | 'hard' | 'good' | 'easy') {
    if (this.isTransitioning()) return;
    const cardId = this.current()?.id;
    if (!cardId) return;
  
    this.isTransitioning.set(true);
    this.api.review(this.stackId, cardId, rating).subscribe((updatedCard) => {
      if (rating === 'again') {
        // Gleiche Karte nochmal zeigen → flip zurück auf Vorderseite
        this.current.set(updatedCard);
        this.showBack.set(false);
        this.isTransitioning.set(false);
      } else {
        // Neue Karte laden (Timeout ist jetzt in loadCard() enthalten)
        this.showBack.set(false);
        this.loadCard();
      }
    });
  }
  
}
