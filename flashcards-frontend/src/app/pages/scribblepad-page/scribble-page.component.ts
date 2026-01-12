import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LoaderComponent } from '../../pages/loader/loader.component';
import { ToastService } from '../../services/toast.service';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environments';

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
export class ScribblePadPage implements OnInit {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private http = inject(HttpClient);

  content = signal<string>('');
  loading = signal(false);
  saving = signal(false);
  lastSaved = signal<Date | null>(null);
  userId = this.auth.getUserId();
  
  // Auto-save timer
  private autoSaveTimer: any = null;
  private readonly AUTO_SAVE_DELAY = 2000; // 2 seconds after typing stops

  ngOnInit() {
    if (!this.isLoggedIn()) {
      this.toast.show('Please log in to access your ScribblePad', 'warning');
      return;
    }
    this.load();
  }

  ngOnDestroy() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
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

  load() {
    this.loading.set(true);
    this.http.get<ScribblePad>(`${environment.apiBase}/scribblepad`, {
      headers: this.getHeaders(),
    }).subscribe({
      next: (pad) => {
        this.content.set(pad.content || '');
        this.lastSaved.set(new Date(pad.updated_at));
        this.loading.set(false);
      },
      error: (err) => {
        // If 404, it means no scribblepad exists yet - that's okay
        if (err.status === 404) {
          this.content.set('');
          this.loading.set(false);
        } else {
          console.error('Error loading ScribblePad:', err);
          this.toast.show('Failed to load your notes', 'error');
          this.loading.set(false);
        }
      }
    });
  }

  onContentChange() {
    // Clear existing timer
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    // Set new timer for auto-save
    this.autoSaveTimer = setTimeout(() => {
      this.save(true);
    }, this.AUTO_SAVE_DELAY);
  }

  save(isAutoSave: boolean = false) {
    if (!this.isLoggedIn()) {
      this.toast.show('Please log in to save your notes', 'warning');
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
        this.saving.set(false);
        if (!isAutoSave) {
          this.toast.show('Notes saved successfully', 'success');
        }
      },
      error: (err) => {
        console.error('Error saving ScribblePad:', err);
        this.saving.set(false);
        this.toast.show('Failed to save notes', 'error');
      }
    });
  }

  clear() {
    if (confirm('Are you sure you want to clear all your notes? This cannot be undone.')) {
      this.content.set('');
      this.save();
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
    
    if (days > 0) return `Saved ${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `Saved ${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `Saved ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (seconds > 5) return `Saved ${seconds} seconds ago`;
    return 'Just saved';
  }

  getCharacterCount(): number {
    return this.content().length;
  }

  getWordCount(): number {
    const text = this.content().trim();
    if (!text) return 0;
    return text.split(/\s+/).length;
  }
}