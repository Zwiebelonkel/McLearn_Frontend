import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Stack } from '../../models';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-stack-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
  ],
  templateUrl: './stack-detail-modal.component.html',
  styleUrls: ['./stack-detail-modal.component.scss']
})
export class StackDetailModalComponent {
  @Input() stack: Stack | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() stackDeleted = new EventEmitter<string>();
  @Output() stackUpdated = new EventEmitter<Stack>();

  hoverRating = 0;
  isRating = false;

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private toast: ToastService,
    private router: Router,
  ) {}

  closeModal(): void {
    this.close.emit();
  }

  isLoggedIn(): boolean {
    return !!this.auth.getUserId();
  }

  isOwner(stack: Stack): boolean {
    return stack.user_id === this.auth.getUserId();
  }

  canEdit(stack: Stack): boolean {
    if (this.isOwner(stack)) return true;
    if (stack.collaborators && Array.isArray(stack.collaborators)) {
      return stack.collaborators.some(collab => collab.user_id === this.auth.getUserId());
    }
    return false;
  }

  rateStack(rating: number): void {
    if (!this.stack || this.isRating) return;
    
    this.isRating = true;
    
    this.api.rateStack(this.stack.id, rating).subscribe({
      next: (updatedStack) => {
        this.toast.show(`Rated ${rating} ⭐`, 'success');
        if (this.stack) {
          this.stack.user_rating = rating;
          this.stack.average_rating = updatedStack.average_rating;
          this.stack.rating_count = updatedStack.rating_count;
          this.stackUpdated.emit(this.stack);
        }
        this.isRating = false;
      },
      error: (err) => {
        console.error('Rating error:', err);
        this.toast.show('Failed to rate stack', 'error');
        this.isRating = false;
      }
    });
  }

  shareStack(stack: Stack): void {
    const url = `${window.location.origin}/stack/${stack.id}/study`;
    
    // Try Web Share API first (mobile)
    if (navigator.share) {
      navigator.share({
        title: stack.name,
        text: `Check out this flashcard stack: ${stack.name}`,
        url: url,
      })
      .then(() => this.toast.show('Shared successfully', 'success'))
      .catch((err) => {
        if (err.name !== 'AbortError') {
          this.copyToClipboard(url);
        }
      });
    } else {
      // Fallback: Copy to clipboard
      this.copyToClipboard(url);
    }
  }

  private copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text)
      .then(() => this.toast.show('Link copied to clipboard', 'success'))
      .catch(() => this.toast.show('Failed to copy link', 'error'));
  }

  exportStack(stack: Stack): void {
    // Get all cards from the stack
    this.api.cards(stack.id).subscribe({
      next: (cards) => {
        if (cards.length === 0) {
          this.toast.show('No cards to export', 'warning');
          return;
        }

        // Create CSV content
        let csv = 'Front,Back\n';
        
        for (const card of cards) {
          const escapeCsv = (text: string) => {
            if (text.includes(',') || text.includes('\n') || text.includes('"')) {
              return `"${text.replace(/"/g, '""')}"`;
            }
            return text;
          };

          csv += `${escapeCsv(card.front)},${escapeCsv(card.back)}\n`;
        }

        // Create download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${stack.name}_export.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.toast.show('Stack exported successfully', 'success');
      },
      error: () => this.toast.show('Failed to export stack', 'error')
    });
  }

  duplicateStack(stack: Stack): void {
    if (!this.isLoggedIn()) {
      this.toast.show('Please log in to duplicate stacks', 'warning');
      return;
    }

    // Create new stack with "[Copy]" suffix
    const newName = `${stack.name} (Copy)`;
    
    this.api.createStack(newName, false).subscribe({
      next: (newStack) => {
        // Get cards from original stack
        this.api.cards(stack.id).subscribe({
          next: (cards) => {
            if (cards.length === 0) {
              this.toast.show('Stack duplicated (no cards)', 'success');
              this.closeModal();
              return;
            }

            // Copy all cards to new stack
            let completed = 0;
            const total = cards.length;

            for (const card of cards) {
              this.api.createCard({
                stack_id: newStack.id,
                front: card.front,
                back: card.back,
                front_image: card.front_image,
              }).subscribe({
                next: () => {
                  completed++;
                  if (completed === total) {
                    this.toast.show(`Stack duplicated with ${total} cards`, 'success');
                    this.closeModal();
                    this.router.navigate(['/stack', newStack.id, 'edit']);
                  }
                },
                error: () => {
                  this.toast.show('Some cards failed to duplicate', 'warning');
                }
              });
            }
          },
          error: () => {
            this.toast.show('Failed to load cards for duplication', 'error');
          }
        });
      },
      error: () => {
        this.toast.show('Failed to duplicate stack', 'error');
      }
    });
  }

  viewProfile(stack: Stack): void {
    this.closeModal();
    this.router.navigate(['/profile', stack.user_id]);
  }

  remove(stack: Stack): void {
    const confirmed = confirm(
      `Are you sure you want to delete "${stack.name}"?\n\n` +
      `This will permanently delete ${stack.card_amount || 0} cards.\n` +
      `This action cannot be undone.`
    );

    if (confirmed) {
      this.api.deleteStack(stack.id).subscribe({
        next: () => {
          this.toast.show('Stack deleted successfully', 'success');
          this.stackDeleted.emit(stack.id);
          this.closeModal();
        },
        error: () => this.toast.show('Failed to delete stack', 'error')
      });
    }
  }
}