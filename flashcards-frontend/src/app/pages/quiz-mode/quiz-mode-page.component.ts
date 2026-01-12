import { Component, inject, signal, HostListener } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Card, Stack } from '../../models';
import { AuthService } from '../../services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  selector: 'app-quiz-mode',
  templateUrl: './quiz-mode-page.component.html',
  styleUrls: ['./quiz-mode-page.component.scss'],
})
export class QuizModePage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private auth = inject(AuthService);

  stackId = this.route.snapshot.paramMap.get('id')!;
  stack = signal<Stack | null>(null);
  cards = signal<Card[]>([]);
  currentIndex = signal(0);
  showBack = signal(false);
  isTransitioning = signal(false);
  userId = this.auth.getUserId();
  quizCompleted = signal(false);

  constructor() {
    this.loadStackAndCards();
  }

  @HostListener('window:keydown.space', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    event.preventDefault();
    this.flip();
  }

  @HostListener('window:keydown.arrowright', ['$event'])
  handleArrowRight(event: KeyboardEvent) {
    event.preventDefault();
    if (this.showBack()) {
      this.nextCard();
    }
  }

  @HostListener('window:keydown.arrowleft', ['$event'])
  handleArrowLeft(event: KeyboardEvent) {
    event.preventDefault();
    if (this.currentIndex() > 0 && !this.showBack()) {
      this.previousCard();
    }
  }

  loadStackAndCards() {
    this.api.getStack(this.stackId).subscribe((stack) => {
      this.stack.set(stack);
    });

    this.api.cards(this.stackId).subscribe((cards) => {
      if (cards.length > 0) {
        this.cards.set(cards);
      }
    });
  }

  get currentCard(): Card | undefined {
    const cards = this.cards();
    const index = this.currentIndex();
    return cards[index];
  }

  renderMarkdown(text: string): string {
    const dirty = marked.parse(text || '') as string;
    return DOMPurify.sanitize(dirty, { ADD_TAGS: ['center'] });
  }

  flip() {
    if (this.isTransitioning() || this.quizCompleted()) return;
    this.showBack.set(!this.showBack());
  }

  nextCard() {
    if (this.isTransitioning() || this.quizCompleted()) return;
    
    const cards = this.cards();
    const nextIndex = this.currentIndex() + 1;

    if (nextIndex >= cards.length) {
      // Quiz completed
      this.quizCompleted.set(true);
      this.showBack.set(false);
      return;
    }

    this.isTransitioning.set(true);
    this.showBack.set(false);

    setTimeout(() => {
      this.currentIndex.set(nextIndex);
      this.isTransitioning.set(false);
    }, 300);
  }

  previousCard() {
    if (this.isTransitioning() || this.currentIndex() === 0) return;

    this.isTransitioning.set(true);
    this.showBack.set(false);

    setTimeout(() => {
      this.currentIndex.set(this.currentIndex() - 1);
      this.isTransitioning.set(false);
    }, 300);
  }

  restartQuiz() {
    this.currentIndex.set(0);
    this.showBack.set(false);
    this.quizCompleted.set(false);
  }

  exitQuiz() {
    this.router.navigate(['/stack', this.stackId, 'study']);
  }

  getProgressPercent(): number {
    const cards = this.cards();
    if (cards.length === 0) return 0;
    return Math.round(((this.currentIndex() + 1) / cards.length) * 100);
  }

  getProgressText(): string {
    const cards = this.cards();
    return `${this.currentIndex() + 1} / ${cards.length}`;
  }

  // Touch gestures for mobile
  private touchStartX = 0;
  private touchStartY = 0;

  handleTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  handleTouchEnd(event: TouchEvent) {
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    
    const deltaX = touchEndX - this.touchStartX;
    const deltaY = touchEndY - this.touchStartY;

    // Swipe detection (horizontal swipe > 50px)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0 && this.currentIndex() > 0 && !this.showBack()) {
        // Swipe right - previous card
        this.previousCard();
      } else if (deltaX < 0 && this.showBack()) {
        // Swipe left - next card
        this.nextCard();
      }
    }
  }
}