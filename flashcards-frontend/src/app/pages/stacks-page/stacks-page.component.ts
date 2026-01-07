import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import { Stack } from '../../models';
import { AuthService } from '../../services/auth.service';
import { LoaderComponent } from '../../pages/loader/loader.component';
import { ToastService } from '../../services/toast.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LoaderComponent, TranslateModule],
  templateUrl: './stacks-page.component.html',
  styleUrls: ['./stacks-page.component.scss']
})
export class StacksPage {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  stacks = signal<Stack[]>([]);
  name = '';
  isPublic = false;
  userId = this.auth.getUserId();
  loading = signal(false);
  search: string = '';
  filter: 'all' | 'public' | 'own' | 'shared' = 'all';
  
  // Dropdown state management
  openDropdownId: string | null = null;

  constructor() {
    this.load();
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  closeDropdown(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.more-menu-button') && !target.closest('.dropdown-menu')) {
      this.openDropdownId = null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.userId;
  }

  isOwner(stack: Stack): boolean {
    return stack.user_id === this.userId;
  }

  canEdit(stack: Stack): boolean {
    if (this.isOwner(stack)) {
      return true;
    }
    return !stack.is_public && !this.isOwner(stack);
  }

  get filteredStacks(): Stack[] {
    return this.stacks().filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(this.search.toLowerCase());
      if (!matchesSearch) {
        return false;
      }
      const isMine = s.user_id === this.userId;
      const isSharedWithMe = !s.is_public && s.user_id !== this.userId;
      switch (this.filter) {
        case 'public':
          return s.is_public;
        case 'own':
          return isMine;
        case 'shared':
          return isSharedWithMe;
        default:
          return true;
      }
    });
  }

  load() {
    this.loading.set(true);
    this.api.stacks().subscribe(s => {
      this.stacks.set(this.isLoggedIn() ? s : s.filter(stack => stack.is_public));
      this.loading.set(false);
    });
  }

  create(e: Event) {
    e.preventDefault();
    this.loading.set(true);
    this.api.createStack(this.name, this.isPublic).subscribe({
      next: () => {
        this.toast.show('Stack created: ' + this.name, 'success');
        this.name = '';
        this.isPublic = false;
        this.load();
      },
      error: (err) => {
        console.error(err);
        this.toast.show('Failed to create stack', 'error');
      },
      complete: () => this.loading.set(false)
    });
  }

  remove(s: Stack) {
    this.closeDropdownMenu();
    if (confirm('Delete stack?')) {
      this.loading.set(true);
      this.api.deleteStack(s.id).subscribe({
        next: () => {
          this.toast.show('Stack deleted', 'success');
          this.load();
        },
        error: (err) => {
          console.error(err);
          this.toast.show('Failed to delete stack', 'error');
        },
        complete: () => this.loading.set(false)
      });
    }
  }

  // Dropdown menu methods
  toggleDropdown(stackId: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.openDropdownId = this.openDropdownId === stackId ? null : stackId;
  }

  isDropdownOpen(stackId: string): boolean {
    return this.openDropdownId === stackId;
  }

  closeDropdownMenu() {
    this.openDropdownId = null;
  }

  // Export functionality
  exportStack(stack: Stack, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.closeDropdownMenu();
    
    this.loading.set(true);
    
    // Fetch all cards for this stack
    this.api.cards(stack.id).subscribe({
      next: (cards) => {
        if (cards.length === 0) {
          this.toast.show('No cards to export', 'warning');
          this.loading.set(false);
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

        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${stack.name}_export.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);

        this.toast.show(`Exported ${cards.length} cards from "${stack.name}"`, 'success');
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Export error:', err);
        this.toast.show('Failed to export stack', 'error');
        this.loading.set(false);
      }
    });
  }

  // Duplicate functionality
  duplicateStack(stack: Stack, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.closeDropdownMenu();
    
    const newName = `${stack.name} (Copy)`;
    
    this.loading.set(true);
    
    // Create new stack
    this.api.createStack(newName, false).subscribe({
      next: (newStack) => {
        // Fetch cards from original stack
        this.api.cards(stack.id).subscribe({
          next: (cards) => {
            if (cards.length === 0) {
              this.toast.show(`Duplicated "${stack.name}" (no cards)`, 'success');
              this.load();
              return;
            }

            // Copy all cards to new stack
            let completed = 0;
            for (const card of cards) {
              this.api.createCard({
                stack_id: newStack.id,
                front: card.front,
                back: card.back,
                front_image: card.front_image
              }).subscribe({
                next: () => {
                  completed++;
                  if (completed === cards.length) {
                    this.toast.show(`Duplicated "${stack.name}" with ${cards.length} cards`, 'success');
                    this.load();
                  }
                },
                error: (err) => {
                  console.error('Error duplicating card:', err);
                  this.loading.set(false);
                }
              });
            }
          },
          error: (err) => {
            console.error('Error fetching cards:', err);
            this.toast.show('Failed to duplicate cards', 'error');
            this.loading.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Error creating duplicate stack:', err);
        this.toast.show('Failed to duplicate stack', 'error');
        this.loading.set(false);
      }
    });
  }

  // Share functionality (based on study-page implementation)
  async shareStack(stack: Stack, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.closeDropdownMenu();

    // Generate study URL for sharing
    const shareUrl = `${window.location.origin}/stack/${stack.id}/study`;
    const shareTitle = stack.name;
    const shareText = `Check out "${stack.name}"${stack.owner_name ? ` by ${stack.owner_name}` : ''} - A flashcard stack to learn from!`;

    // Update meta tags for better social media preview
    this.updateMetaTags(shareTitle, shareText, shareUrl);

    // Check if Web Share API is available (mostly mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        // Success - no toast needed as the share dialog confirms
      } catch (err: any) {
        // User cancelled or error occurred
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
          // Fallback to clipboard on error
          this.copyToClipboard(shareText, shareUrl);
        }
      }
    } else {
      // Fallback: Copy to clipboard for desktop
      this.copyToClipboard(shareText, shareUrl);
    }
  }

  private async copyToClipboard(text: string, url: string) {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      this.toast.show('Link copied to clipboard!', 'success');
    } catch (err) {
      // If clipboard fails, show a prompt
      console.error('Clipboard failed:', err);
      const result = prompt('Copy this link:', `${text}\n${url}`);
      if (result !== null) {
        this.toast.show('Link ready to copy', 'info');
      }
    }
  }

  private updateMetaTags(title: string, description: string, url: string) {
    // Get logo URL
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