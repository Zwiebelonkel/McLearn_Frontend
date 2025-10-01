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
  styleUrls: ['./study-page.component.scss']
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
        this.current.set(updatedCard);
        this.showBack.set(false);
        this.isTransitioning.set(false);
      } else {
        this.showBack.set(false);
        this.loadCard();
      }
    });
  }

  getBoxLabel(box: number | undefined | null): string {
    switch (box) {
      case 1: return 'Very hard';
      case 2: return 'Hard';
      case 3: return 'Normal';
      case 4: return 'Easy';
      case 5: return 'Very easy';
      default: return '';
    }
  }
}