import { Component, inject, signal, HostListener, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Card, Stack } from '../../models';
import { AuthService } from '../../services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { marked } from 'marked';
import { ViewChild } from '@angular/core';
import { RainComponent } from '../../components/rain/rain.component';
import DOMPurify from 'dompurify';

interface QuizResult {
  cardId: string;
  correct: boolean;
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, RainComponent],
  selector: 'app-quiz-mode',
  templateUrl: './quiz-mode-page.component.html',
  styleUrls: ['./quiz-mode-page.component.scss'],
})
export class QuizModePage {
  @ViewChild('rain') rainComponent!: RainComponent;
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
  
  // Track quiz results
  results = signal<QuizResult[]>([]);

  // Computed statistics
  correctCount = computed(() => 
    this.results().filter(r => r.correct).length
  );
  
  incorrectCount = computed(() => 
    this.results().filter(r => !r.correct).length
  );

  totalAnswered = computed(() => this.results().length);

  correctPercentage = computed(() => {
    const total = this.totalAnswered();
    if (total === 0) return 0;
    return Math.round((this.correctCount() / total) * 100);
  });

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
      this.markCorrect();
    }
  }

  @HostListener('window:keydown.arrowleft', ['$event'])
  handleArrowLeft(event: KeyboardEvent) {
    event.preventDefault();
    if (this.showBack()) {
      this.markIncorrect();
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

  get currentCard() {
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

  markCorrect() {
    const card = this.currentCard;
    if (!card) return;
    
    this.results.update(results => [...results, { cardId: card.id, correct: true }]);
    this.nextCard();
  }

  markIncorrect() {
    const card = this.currentCard;
    if (!card) return;
    
    this.results.update(results => [...results, { cardId: card.id, correct: false }]);
    this.nextCard();
  }

  nextCard() {
    if (this.isTransitioning() || this.quizCompleted()) return;
    
    const cards = this.cards();
    const nextIndex = this.currentIndex() + 1;

    if (nextIndex >= cards.length) {
      // Quiz completed
      this.quizCompleted.set(true);
      this.showBack.set(false);
      this.rainComponent.emojiRain("🎉")
      return;
    }

    this.isTransitioning.set(true);
    this.showBack.set(false);

    setTimeout(() => {
      this.currentIndex.set(nextIndex);
      this.isTransitioning.set(false);
    }, 300);
  }

  restartQuiz() {
    this.currentIndex.set(0);
    this.showBack.set(false);
    this.quizCompleted.set(false);
    this.results.set([]);
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

  // Get the visual representation of results for the horizontal bar
  getResultSegments() {
    return this.results().map(result => ({
      correct: result.correct,
      percentage: (1 / this.cards().length) * 100
    }));
  }

  // Touch gestures for mobile
  private touchStartX = 0;
  private touchStartY = 0;

  handleTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  handleTouchEnd(event: TouchEvent) {
    if (!this.showBack()) return;

    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    
    const deltaX = touchEndX - this.touchStartX;
    const deltaY = touchEndY - this.touchStartY;

    // Swipe detection (horizontal swipe > 50px)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe right - correct
        this.markCorrect();
      } else {
        // Swipe left - incorrect
        this.markIncorrect();
      }
    }
  }

  // Share functionality
  async shareStack() {
    const stack = this.stack();
    if (!stack) return;

    const shareUrl = `${window.location.origin}/stack/${this.stackId}/quiz`;
    const shareTitle = `${stack.name} - Quiz Mode`;
    const shareText = `Try the quiz for "${stack.name}"${stack.owner_name ? ` by ${stack.owner_name}` : ''}!`;

    this.updateMetaTags(shareTitle, shareText, shareUrl);

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        console.log('Share cancelled or failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert('Link copied to clipboard!');
      } catch (err) {
        prompt('Copy this link:', `${shareText}\n${shareUrl}`);
      }
    }
  }

  private updateMetaTags(title: string, description: string, url: string) {
    const logoUrl = `${window.location.origin}/assets/apple-touch-icon.png`;
    
    this.setMetaTag('og:title', title);
    this.setMetaTag('og:description', description);
    this.setMetaTag('og:url', url);
    this.setMetaTag('og:image', logoUrl);
    this.setMetaTag('og:type', 'website');
    
    this.setMetaTag('twitter:card', 'summary');
    this.setMetaTag('twitter:title', title);
    this.setMetaTag('twitter:description', description);
    this.setMetaTag('twitter:image', logoUrl);
  }

  private setMetaTag(property: string, content: string) {
    const prefix = property.startsWith('og:') ? 'property' : 'name';
    let element = document.querySelector(`meta[${prefix}="${property}"]`);
    
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(prefix, property);
      document.head.appendChild(element);
    }
    
    element.setAttribute('content', content);
  }
}