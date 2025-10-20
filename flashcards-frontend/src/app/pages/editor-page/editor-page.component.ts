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


  declare var cloudinary: any;

  @Component({
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, LoaderComponent, TranslateModule],
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
    stack = signal<Stack | null>(null); // Signal für Stack
    search: string = '';
    isPublic = false;
    loading = signal(false);
    canEdit = false;
    isOwner = false;
    userId = this.auth.getUserId();
    showCollaboratorsModal = signal(false);
    inviteeSearch = '';
    searchedUsers: User[] = [];
  
    @ViewChild('backArea') backArea!: ElementRef<HTMLTextAreaElement>;
  
    constructor() {
      this.loading.set(true);
      this.api.getStack(this.stackId).subscribe(s => {
        this.stack.set(s);
        this.isPublic = s.is_public; // Public-Status vorbefüllen
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
        this.loading.set(false);
      });
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
      this.api.updateStack(s.id, s.name, this.isPublic).subscribe({
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
    
  
    insert(type: 'bold' | 'italic' | 'code' | 'ul' | 'center') {
      const textarea = this.backArea.nativeElement;
      const { selectionStart, selectionEnd, value } = textarea;
      const selected = value.slice(selectionStart, selectionEnd);
  
      let inserted = '';
      switch (type) {
        case 'bold':
          inserted = `**${selected || 'fett'}**`;
          break;
        case 'italic':
          inserted = `*${selected || 'kursiv'}*`;
          break;
        case 'code':
          inserted = `\`${selected || 'code'}\``;
          break;
        case 'ul':
          inserted = selected
            ? selected.split('\n').map(line => `- ${line}`).join('\n')
            : '- ';
          break;
        case 'center':
          inserted = `<center>${selected || 'zentriert'}</center>`;
          break;
      }
  
      const newValue = value.slice(0, selectionStart) + inserted + value.slice(selectionEnd);
      this.back = newValue;
  
      setTimeout(() => {
        textarea.focus();
        const cursor = selectionStart + inserted.length;
        textarea.setSelectionRange(cursor, cursor);
      });
    }
  
    importCSV(event: Event) {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;
    
      this.loading.set(true);
    
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
    
        const lines = text.trim().split('\n');
    
        // Header prüfen und überspringen
        const startIndex = lines[0].toLowerCase().includes('front') ? 1 : 0;
    
        // Karten zum Erstellen vorbereiten
        const cardsToCreate: { front: string; back: string }[] = [];
    
        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue; // leere Zeilen überspringen
    
          // Nur am ersten Komma splitten
          const firstCommaIndex = line.indexOf(',');
          if (firstCommaIndex === -1) {
            console.warn(`Ungültige Zeile ohne Komma (Überspringen): "${line}"`);
            continue;
          }
    
          let front = line.slice(0, firstCommaIndex).trim();
          let back = line.slice(firstCommaIndex + 1).trim();
    
          // Anführungszeichen am Anfang und Ende entfernen
          if (front.startsWith('"') && front.endsWith('"')) {
            front = front.slice(1, -1);
          }
          if (back.startsWith('"') && back.endsWith('"')) {
            back = back.slice(1, -1);
          }
    
          // Noch vorhandene Anführungszeichen in Mitte ersetzen (optional)
          front = front.replace(/""/g, '"');
          back = back.replace(/""/g, '"');
    
          if (!front || !back) {
            console.warn(`Leeres front oder back (Überspringen): Front="${front}" Back="${back}"`);
            continue;
          }
    
          cardsToCreate.push({ front, back });
        }
    
        if (cardsToCreate.length === 0) {
          this.loading.set(false);
          this.toast.show('Keine gültigen Karten zum Import gefunden.', 'warning');
          return;
        }
    
        let completed = 0;
        for (const card of cardsToCreate) {
          this.api.createCard({
            stack_id: this.stackId,
            front: card.front,
            back: card.back
          }).subscribe({
            next: () => {
              completed++;
              if (completed === cardsToCreate.length) {
                this.reload();
                this.loading.set(false);
                this.toast.show(`${completed} Karten erfolgreich importiert.`, 'success');
              }
            },
            error: (err) => {
              console.error('Fehler beim Import:', err);
              this.loading.set(false);
              this.toast.show('Fehler beim Import. Details siehe Konsole.', 'error');
            }
          });
        }
      };
    
      reader.readAsText(file);
    }
    
    

  get filteredCards(): Card[] {
    const cardsArray = this.cards();
    return cardsArray.filter(c => {
      const searchLower = this.search.toLowerCase();
      return c.front.toLowerCase().includes(searchLower);
    });
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
        this.openCollaboratorsModal(); // Refresh collaborator list
      });
    }
  }

  removeCollaborator(collaboratorId: string) {
    const stack = this.stack();
    if (stack) {
      this.api.removeCollaborator(stack.id, collaboratorId).subscribe(() => {
        this.toast.show('Collaborator removed', 'success');
        this.openCollaboratorsModal(); // Refresh collaborator list
      });
    }
  }
}
