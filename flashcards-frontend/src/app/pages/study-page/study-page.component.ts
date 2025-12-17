import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
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


hasCards  = this.cards().length > 0;
canFlip = !this.isTransitioning() && this.current() !== null;
canRate = !this.isTransitioning() && this.isOwner() && this.current() !== null;

  constructor() {
    this.loadCard();
    this.loadCards();
    this.api.getStack(this.stackId).subscribe((stack) => this.stack.set(stack));
  }

  isOwner(): boolean {
    return this.stack()?.user_id === this.userId;
  }

  renderMarkdown(text: string): string {
    const dirty = marked.parse(text || '') as string;
    return DOMPurify.sanitize(dirty, { ADD_TAGS: ['center'] });
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
    if (this.isTransitioning() || !this.isOwner()) return;
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

 // Touch gestures for mobile
 private touchStartX = 0;
 private touchStartY = 0;

 handleTouchStart(event: TouchEvent) {
   this.touchStartX = event.touches[0].clientX;
   this.touchStartY = event.touches[0].clientY;
 }

 handleTouchEnd(event: TouchEvent) {
   if (!this.showBack() || !this.canRate) return;

   const touchEndX = event.changedTouches[0].clientX;
   const touchEndY = event.changedTouches[0].clientY;
   
   const deltaX = touchEndX - this.touchStartX;
   const deltaY = touchEndY - this.touchStartY;

   // Swipe detection (horizontal swipe > 50px)
   if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
     if (deltaX > 0) {
       // Swipe right - good
       this.rate('good');
     } else {
       // Swipe left - again
       this.rate('again');
     }
   }
 }

 async shareStack() {
   const stack = this.stack();
   if (!stack) return;

   const shareUrl = window.location.href;
   const shareTitle = `${stack.name}`;
   const shareText = `Check out "${stack.name}" by ${stack.owner_name || 'Unknown'} - A flashcard stack to learn from!`;

   // Update meta tags for social media preview
   this.updateMetaTags(shareTitle, shareText, shareUrl);

   // Check if Web Share API with files is available (mostly mobile)
   if (navigator.share) {
     try {
       // Try to share with image if available
       if (navigator.share) {
         await navigator.share({
           title: shareTitle,
           text: shareText,
           url: shareUrl
         });
       } else {
         // Fallback without image check
         await navigator.share({
           title: shareTitle,
           text: shareText,
           url: shareUrl
         });
       }
     } catch (err) {
       // User cancelled or error occurred
       console.log('Share cancelled or failed:', err);
     }
   } else {
     // Fallback: Copy to clipboard
     try {
       await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
       alert('Link copied to clipboard!');
     } catch (err) {
       // If clipboard fails, show a prompt
       prompt('Copy this link:', `${shareText}\n${shareUrl}`);
     }
   }
 }

 private updateMetaTags(title: string, description: string, url: string) {
   // Get logo URL - using apple-touch-icon.png
   const logoUrl = `${window.location.origin}/assets/apple-touch-icon.png`;
   
   // Update or create Open Graph meta tags for social media previews
   this.setMetaTag('og:title', title);
   this.setMetaTag('og:description', description);
   this.setMetaTag('og:url', url);
   this.setMetaTag('og:image', logoUrl);
   this.setMetaTag('og:type', 'website');
   
   // Twitter Card meta tags
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