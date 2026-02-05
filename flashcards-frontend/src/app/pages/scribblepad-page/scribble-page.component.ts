import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LoaderComponent } from '../../pages/loader/loader.component';
import { ToastService } from '../../services/toast.service';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environments';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

interface ScribblePad {
  id: string;
  user_id: number;
  content: string;
  updated_at: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent, TranslateModule],
  templateUrl: './scribble-page.component.html',
  styleUrls: ['./scribble-page.component.scss']
})
export class ScribblePadPage implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private http = inject(HttpClient);

  content = signal<string>('');
  loading = signal(false);
  saving = signal(false);
  lastSaved = signal<Date | null>(null);
  userId = this.auth.getUserId();

  readonly maxChars = 10000;

  private contentChanged = new Subject<string>();
  private destroy$ = new Subject<void>();
  private autoPollInterval: any = null;
  private isTyping = false;


  ngOnInit() {
    if (!this.isLoggedIn()) {
      this.toast.show('Please log in to access your ScribblePad', 'warning');
      return;
    }
    this.load(true);
    this.startPolling();

    this.contentChanged.pipe(
        debounceTime(2000), // AUTO_SAVE_DELAY
        takeUntil(this.destroy$)
    ).subscribe(() => {
        this.save(true);
        this.isTyping = false;
        this.startPolling();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopPolling();
  }

  isLoggedIn(): boolean {
    return !!this.userId;
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'X-API-Key': environment.apiKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  load(showLoading = false) {
    if (this.isTyping || this.saving()) return;

    if (showLoading) this.loading.set(true);

    this.http.get<ScribblePad>(`${environment.apiBase}/scribblepad`, {
      headers: this.getHeaders(),
    }).subscribe({
      next: (pad) => {
        // Only update if the content on the server is different
        if (this.content() !== pad.content) {
            this.content.set(pad.content || '');
        }
        this.lastSaved.set(new Date(pad.updated_at));
        if (showLoading) this.loading.set(false);
      },
      error: (err) => {
        if (showLoading) this.loading.set(false);
        if (err.status === 404) {
          this.content.set(''); // No pad exists, this is fine
        } else {
          console.error('Error loading ScribblePad:', err);
          this.toast.show('Failed to load your notes', 'error');
        }
      }
    });
  }

  onContentChange(newContent: string) {
    this.stopPolling();
    this.isTyping = true;
    this.content.set(newContent);

    if (newContent.length > this.maxChars) {
        this.toast.show(`Character limit of ${this.maxChars} reached. Saving is disabled.`, 'warning');
        return;
    }

    this.contentChanged.next(newContent);
  }

  save(isAutoSave: boolean = false) {
    if (!this.isLoggedIn()) {
      if (!isAutoSave) this.toast.show('Please log in to save your notes', 'warning');
      return;
    }

    if (this.content().length > this.maxChars) {
      if (!isAutoSave) {
        this.toast.show(`Your notes are too long to save (over ${this.maxChars} characters).`, 'error');
      }
      return;
    }

    this.saving.set(true);
    this.http.post<ScribblePad>(
      `${environment.apiBase}/scribblepad`,
      { content: this.content() },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (pad) => {
        this.lastSaved.set(new Date(pad.updated_at));
        if (!isAutoSave) {
          this.toast.show('Notes saved successfully', 'success');
        }
      },
  error: (err) => {
        console.error('Error saving ScribblePad:', err);
        if (!isAutoSave) {
          this.toast.show('Failed to save notes', 'error');
        }
      },
      complete: () => {
        this.saving.set(false);
        this.isTyping = false;
        this.startPolling(); // Restart polling after save attempt
      }
    });
  }

  clear() {
    if (confirm('Are you sure you want to clear all your notes? This cannot be undone.')) {
      this.content.set('');
      this.save();
    }
  }

  startPolling() {
    this.stopPolling(); // Ensure no multiple intervals are running
    if (!this.isTyping) {
        this.autoPollInterval = setInterval(() => {
            this.load();
        }, 5000);
    }
  }

  stopPolling() {
    if (this.autoPollInterval) {
      clearInterval(this.autoPollInterval);
      this.autoPollInterval = null;
    }
  }

  getLastSavedText(): string {
    if (!this.lastSaved()) {
      return 'Never saved';
    }

    const now = new Date();
    const saved = this.lastSaved()!;
    const diff = now.getTime() - saved.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (this.saving()) return 'Saving...';
    if (seconds < 5) return 'Just saved';
    if (this.isTyping) return 'Typing...';
    if (this.autoPollInterval) return 'Up to date';

    if (days > 0) return `Saved ${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `Saved ${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `Saved ${minutes} minute${minutes > 1 ? 's' : ''} ago`;

    return `Saved ${seconds} seconds ago`;
  }

  getCharacterCount(): number {
    return this.content().length;
  }

  getWordCount(): number {
    const text = this.content().trim();
    if (!text) return 0;
    return text.split(/\s+/).length;
  }

  copyAll() {
    if (!this.content()) return;

    navigator.clipboard.writeText(this.content()).then(() => {
      this.toast.show('Copied to clipboard', 'success');
    }).catch(() => {
      this.toast.show('Failed to copy', 'error');
    });
  }
}
