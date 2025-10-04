import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Card, Stack } from '../../models';
import { AuthService } from '../../services/auth.service';

import { marked } from 'marked';
import DOMPurify from 'dompurify';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  selector: 'app-study-page',
  templateUrl: './study-page.component.html',
  styleUrls: ['./study-page.component.scss'],
})
export class StudyPage {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private auth = inject(AuthService);

  stackId = this.route.snapshot.paramMap.get('id')!;
  stack = signal<Stack | null>(null);
  current = signal<Card | null>(null);
  cards = signal<Card[]>([]);
  showBack = signal(false);
  isTransitioning = signal(false);
  userId = this.auth.getUserId();
  flyDirection = signal<'left' | 'right' | null>(null);

  constructor() {
    this.loadCard();
    this.loadCards();
    this.api.getStack(this.stackId).subscribe((stack) => this.stack.set(stack));
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
      this.api.nextCard(this.stackId).subscribe((card) => {
        this.current.set(card);
        this.isTransitioning.set(false);
      });
    }, 0);
  }

  loadCards() {
    this.api.cards(this.stackId).subscribe((cards) => {
      this.cards.set(cards);
    });
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

    // 🧭 Richtung merken für Animation
    this.flyDirection.set(
      rating === 'hard' || rating === 'again' ? 'left' : 'right'
    );

    // ⏱ Karte "wegfliegen lassen", dann bewerten
    setTimeout(() => {
      this.api.review(this.stackId, cardId, rating).subscribe((updatedCard) => {
        // 🟢 Direkt Fortschrittsbalken aktualisieren:
        this.loadCards();

        // Karte aktualisieren (wichtig bei "again")
        this.current.set(updatedCard);
        this.flyDirection.set(null);

        if (rating === 'again') {
          // Karte bleibt dieselbe
          this.showBack.set(false);
          this.isTransitioning.set(false);
        } else {
          // Karte wechselt nach kleiner Pause
          this.showBack.set(false);
          setTimeout(() => this.loadCard(), 100);
        }
      });
    }, 200); // Zeit für Fluganimation
  }

  getBoxLabel(box: number | undefined | null): string {
    switch (box) {
      case 1:
        return 'Very hard';
      case 2:
        return 'Hard';
      case 3:
        return 'Normal';
      case 4:
        return 'Easy';
      case 5:
        return 'Very easy';
      default:
        return '';
    }
  }

  getProgressPercent(): number {
    const cardList = this.cards();
    if (cardList.length === 0) return 0;

    const maxBox = 5;
    const total = cardList.length;
    const scoreSum = cardList.reduce((sum, c) => sum + (c.box || 1), 0);

    const percent = ((scoreSum - total) / (total * (maxBox - 1))) * 100;
    return Math.round(Math.max(0, Math.min(100, percent)));
  }
}
