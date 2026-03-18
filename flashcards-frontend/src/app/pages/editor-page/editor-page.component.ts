import {
  Component,
  inject,
  signal,
  ViewChild,
  ElementRef,
  NgZone
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, CreateCardPayload } from '../../services/api.service';
import { Card, Stack, User } from '../../models';
import { LoaderComponent } from '../../pages/loader/loader.component';
import { ToastService } from '../../services/toast.service';
import { environment } from '../../../environments/environments';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { StackStatisticsComponent } from '../../components/stats/stats.component';
import { QuillModule } from 'ngx-quill';
declare var cloudinary: any;

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoaderComponent, TranslateModule, StackStatisticsComponent, QuillModule],
  templateUrl: './editor-page.component.html',
  styleUrls: ['./editor-page.component.scss']
})
export class EditorPage {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private zone = inject(NgZone);
  private auth = inject(AuthService);

  stackId = this.route.snapshot.paramMap.get('id')!;
  cards = signal<Card[]>([]);
  front = '';
  back = '';
  frontImage = '';
  stack = signal<Stack | null>(null);
  search: string = '';
  isPublic = false;
  loading = signal(false);
  canEdit = false;
  isOwner = false;
  userId = this.auth.getUserId();
  showCollaboratorsModal = signal(false);
  inviteeSearch = '';
  searchedUsers: User[] = [];
  selectedCardIds = new Set<String>();
  showStatistics = signal(false);
  showBackEditor = signal(false);
  editingCard = signal<Card | null>(null);
  
  // Import Progress
  importProgress = signal(0);
  importTotal = signal(0);
  isImporting = signal(false);

  private autoSaveTimers = new Map<string, any>();
  lastSavedFront = new Map<string, string>();
  lastSavedBack = new Map<string, string>();
  private readonly AUTO_SAVE_DELAY = 1500;
  // Save-Status pro Karte
  savingCards = new Set<string>();
  saveErrorCards = new Set<string>();

  @ViewChild(StackStatisticsComponent) statsComponent?: StackStatisticsComponent;

  constructor() {
    this.loading.set(true);
    this.api.getStack(this.stackId).subscribe(s => {
      this.stack.set(s);
      this.isPublic = s.is_public;
      this.isOwner = s.user_id === this.userId;
      this.canEdit = this.isOwner || (s.collaborators?.some(c => c.user_id === this.userId && c.can_edit) ?? false);
      this.loading.set(false);
    });
    this.reload();
  }

  reload() {
    this.loading.set(true);
    this.api.cards(this.stackId).subscribe(cs => {
      this.cards.set(cs);
  
      // 🔐 Initiale Werte merken
      for (const c of cs) {
        this.lastSavedFront.set(c.id, c.front);
        this.lastSavedBack.set(c.id, c.back);
      }
  
      this.loading.set(false);
    });
  }

  toggleStatistics() {
    this.showStatistics.update(v => !v);
  }

  openImageUploader() {
    if (typeof cloudinary === 'undefined') {
      this.toast.show('Error: Cloudinary script not loaded. Please try again later.', 'error');
      return;
    }
    const widget = cloudinary.createUploadWidget({
      cropping: true,
      showSkipCropButton: true,
      cloudName: environment.cloudinary.cloudName,
      uploadPreset: environment.cloudinary.uploadPreset
    }, (error: any, result: any) => {
      if (!error && result && result.event === 'success') {
        this.zone.run(() => {
          this.frontImage = result.info.secure_url;
        });
      }
    });
    widget.open();
  }

  removeImage() {
    this.frontImage = '';
  }

  openCardImageUploader(card: Card) {
    if (typeof cloudinary === 'undefined') {
      this.toast.show('Error: Cloudinary script not loaded. Please try again later.', 'error');
      return;
    }
    const widget = cloudinary.createUploadWidget({
      cloudName: environment.cloudinary.cloudName,
      uploadPreset: environment.cloudinary.uploadPreset
    }, (error: any, result: any) => {
      if (!error && result && result.event === 'success') {
        this.zone.run(() => {
          card.front_image = result.info.secure_url;
        });
      }
    });
    widget.open();
  }

  removeCardImage(card: Card) {
    card.front_image = '';
    this.save(card);
  }

  add(e: Event) {
    e.preventDefault();
    this.loading.set(true);
    const payload: CreateCardPayload = {
      stack_id: this.stackId,
      front: this.front,
      back: this.back,
      front_image: this.frontImage
    };
    this.api.createCard(payload).subscribe({
      next: () => {
        this.toast.show('Card added: ' + this.front, 'success');
        this.front = '';
        this.back = '';
        this.frontImage = '';
        this.reload();
      },
      error: (err) => {
        console.error(err);
        this.toast.show('Error adding card', 'error');
        this.loading.set(false);
      }
    });
  }

  saveStack() {
    const s = this.stack();
    if (!s) return;
  
    this.loading.set(true);
    this.api.updateStack(s.id, s.name, s.description, this.isPublic, s.cover_image).subscribe({
      next: () => {
        this.toast.show('Stack saved', 'success');
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.toast.show('Error saving stack', 'error');
        this.loading.set(false);
      }
    });
  }

  openCoverImageUploader() {
    if (typeof cloudinary === 'undefined') {
      this.toast.show('Error: Cloudinary script not loaded. Please try again later.', 'error');
      return;
    }
    const widget = cloudinary.createUploadWidget({
      cropping: true,
      showSkipCropButton: false,
      croppingAspectRatio: 16 / 9, // Force 16:9 aspect ratio for covers
      cloudName: environment.cloudinary.cloudName,
      uploadPreset: environment.cloudinary.uploadPreset
    }, (error: any, result: any) => {
      if (!error && result && result.event === 'success') {
        this.zone.run(() => {
          const currentStack = this.stack();
          if (currentStack) {
            currentStack.cover_image = result.info.secure_url;
            this.stack.set(currentStack);
          }
        });
      }
    });
    widget.open();
  }
  
  removeCoverImage() {
    const currentStack = this.stack();
    if (currentStack) {
      currentStack.cover_image = undefined;
      this.stack.set(currentStack);
    }
  }

  del(c: Card) {
    if (confirm('Delete card?')) {
      this.loading.set(true);
      this.api.deleteCard(c.id).subscribe({
        next: () => {
          this.reload();
          this.toast.show('Card deleted', 'success');
        },
        error: (err) => {
          console.error(err);
          this.toast.show('Error deleting card', 'error');
          this.loading.set(false);
        }
      });
    }
  }

  save(c: Card) {
    this.loading.set(true);
    this.api.updateCard(c.id, { front: c.front, back: c.back, front_image: c.front_image }).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.show('Card updated', 'success');
      },
      error: (err) => {
        console.error(err);
        this.toast.show('Error updating card', 'error');
        this.loading.set(false);
      }
    });
  }

  openBackEditor(card: Card) {
    this.editingCard.set(card);
    this.showBackEditor.set(true);
  }

  closeBackEditor() {
    this.showBackEditor.set(false);
    this.editingCard.set(null);
  }

  importCSV(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.trim().split('\n');
      const startIndex = lines[0].toLowerCase().includes('front') ? 1 : 0;
      const cardsToCreate: { front: string; back: string }[] = [];

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const firstSeparatorIndex = line.indexOf('~');
        if (firstSeparatorIndex === -1) {
          console.warn(`Invalid line without separator (skipping): "${line}"`);
        continue;
        }

        let front = line.slice(0, firstSeparatorIndex).trim();
        let back = line.slice(firstSeparatorIndex + 1).trim();

        if (front.startsWith('"') && front.endsWith('"')) {
          front = front.slice(1, -1);
        }
        if (back.startsWith('"') && back.endsWith('"')) {
          back = back.slice(1, -1);
        }

        front = front.replace(/""/g, '"');
        back = back.replace(/""/g, '"');

        if (!front || !back) {
          console.warn(`Empty front or back (skipping): Front="${front}" Back="${back}"`);
          continue;
        }

        cardsToCreate.push({ front, back });
      }

      if (cardsToCreate.length === 0) {
        this.toast.show('No valid cards found for import.', 'warning');
        return;
      }

      // Progress initialisieren
      this.isImporting.set(true);
      this.importTotal.set(cardsToCreate.length);
      this.importProgress.set(0);

      let completed = 0;
      let hasError = false;

      for (const card of cardsToCreate) {
        this.api.createCard({
          stack_id: this.stackId,
          front: card.front,
          back: card.back
        }).subscribe({
          next: () => {
            completed++;
            this.importProgress.set(completed);
            
            if (completed === cardsToCreate.length) {
              this.isImporting.set(false);
              this.reload();
              if (!hasError) {
                this.toast.show(`${completed} cards successfully imported.`, 'success');
              }
            }
          },
          error: (err) => {
            console.error('Import error:', err);
            hasError = true;
            completed++;
            this.importProgress.set(completed);
            
            if (completed === cardsToCreate.length) {
              this.isImporting.set(false);
              this.toast.show('Import completed with errors. See console for details.', 'error');
              this.reload();
            }
          }
        });
      }
    };

    reader.readAsText(file);
    
    // Reset file input
    input.value = '';
  }

  exportCSV() {
    const cardsArray = this.cards();
    if (cardsArray.length === 0) {
      this.toast.show('No cards to export', 'warning');
      return;
    }

    let csv = 'Front~Back\n';

    for (const card of cardsArray) {
      const escapeCsv = (text: string) => {
        if (text.includes('~') || text.includes('\n') || text.includes('"')) {
          return `"${text.replace(/"/g, '""')}"`;
        }
        return text;
      };

      csv += `${escapeCsv(card.front)}~${escapeCsv(card.back)}\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${this.stack()?.name || 'cards'}_export.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.toast.show('CSV exported successfully', 'success');
  }

  get filteredCards(): Card[] {
    const cardsArray = this.cards();
    return cardsArray.filter(c => {
      const searchLower = this.search.toLowerCase();
      return c.front.toLowerCase().includes(searchLower);
    });
  }

  get importProgressPercent(): number {
    const total = this.importTotal();
    if (total === 0) return 0;
    return Math.round((this.importProgress() / total) * 100);
  }

  openCollaboratorsModal() {
    const stack = this.stack();
    if (stack) {
      this.showCollaboratorsModal.set(true);
      this.api.getCollaborators(stack.id).subscribe(collaborators => {
        const newStack = this.stack();
        if (newStack) {
          newStack.collaborators = collaborators;
          this.stack.set(newStack);
        }
      });
    }
  }

  closeCollaboratorsModal() {
    this.showCollaboratorsModal.set(false);
    this.inviteeSearch = '';
    this.searchedUsers = [];
  }

  searchUsers() {
    if (this.inviteeSearch.trim() === '') {
      this.searchedUsers = [];
      return;
    }
    this.api.searchUsers(this.inviteeSearch).subscribe(users => {
      this.searchedUsers = users;
    });
  }

  addCollaborator(userId: number) {
    const stack = this.stack();
    if (stack) {
      this.api.addCollaborator(stack.id, userId).subscribe(() => {
        this.toast.show('Collaborator added', 'success');
        this.openCollaboratorsModal();
      });
    }
  }

  removeCollaborator(collaboratorId: string) {
    const stack = this.stack();
    if (stack) {
      this.api.removeCollaborator(stack.id, collaboratorId).subscribe(() => {
        this.toast.show('Collaborator removed', 'success');
        this.openCollaboratorsModal();
      });
    }
  }

  isSelected(card: Card): boolean {
    return this.selectedCardIds.has(card.id);
  }
  
  toggleSelection(card: Card) {
    if (this.selectedCardIds.has(card.id)) {
      this.selectedCardIds.delete(card.id);
    } else {
      this.selectedCardIds.add(card.id);
    }
  }
  
  hasSelection(): boolean {
    return this.selectedCardIds.size > 0;
  }
  
  deleteSelected() {
    if (this.selectedCardIds.size === 0) return;
  
    if (!confirm(`Really delete ${this.selectedCardIds.size} cards?`)) {
      return;
    }
  
    this.loading.set(true);
  
    const ids = Array.from(this.selectedCardIds);
    let completed = 0;
  
    for (const id of ids) {
      this.api.deleteCard(id.toString()).subscribe({
        next: () => {
          completed++;
          if (completed === ids.length) {
            this.selectedCardIds.clear();
            this.reload();
            this.toast.show(`${completed} cards deleted`, 'success');
          }
        },
        error: err => {
          console.error(err);
          this.loading.set(false);
          this.toast.show('Error deleting multiple cards', 'error');
        }
      });
    }
  }

  saveSelected() {
    if (this.selectedCardIds.size === 0) return;
  
    if (!confirm(`Really save ${this.selectedCardIds.size} cards?`)) {
      return;
    }
  
    this.loading.set(true);
  
    const cardsToSave = this.cards().filter(c => this.selectedCardIds.has(c.id));
    let completed = 0;
  
    for (const c of cardsToSave) {
      this.api.updateCard(c.id, { front: c.front, back: c.back, front_image: c.front_image }).subscribe({
        next: () => {
          completed++;
          if (completed === cardsToSave.length) {
            this.selectedCardIds.clear();
            this.reload();
            this.toast.show(`${completed} cards saved`, 'success');
          }
        },
        error: err => {
          console.error(err);
          this.loading.set(false);
          this.toast.show('Error saving multiple cards', 'error');
        }
      });
    }
  }

  onCardChange(card: Card, field: 'front' | 'back') {
    if (!this.canEdit) return;
  
    const last =
      field === 'front'
        ? this.lastSavedFront.get(card.id)
        : this.lastSavedBack.get(card.id);
  
    const current = field === 'front' ? card.front : card.back;
    if (last === current) return;
  
    clearTimeout(this.autoSaveTimers.get(card.id));
  
    // 🔄 Status setzen
    this.savingCards.add(card.id);
    this.saveErrorCards.delete(card.id);
  
    const timer = setTimeout(() => {
      this.api.updateCard(card.id, {
        front: card.front,
        back: card.back,
        front_image: card.front_image
      }).subscribe({
        next: () => {
          this.lastSavedFront.set(card.id, card.front);
          this.lastSavedBack.set(card.id, card.back);
  
          this.savingCards.delete(card.id);
          this.saveErrorCards.delete(card.id);
        },
        error: err => {
          console.error(err);
          this.savingCards.delete(card.id);
          this.saveErrorCards.add(card.id);
        }
      });
    }, this.AUTO_SAVE_DELAY);
  
    this.autoSaveTimers.set(card.id, timer)
  }

  getHighlightedCardId(): string | null {
    return this.statsComponent?.highlightedCardId() ?? null;
  }
}
