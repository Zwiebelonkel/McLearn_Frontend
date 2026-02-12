import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { LoaderComponent } from '../../pages/loader/loader.component';
import { ToastService } from '../../services/toast.service';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

interface ScribblePad {
  id: string;
  user_id: number;
  content: string;
  image?: string | null;
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
  private api = inject(ApiService);
  private toast = inject(ToastService);

  content = signal<string>('');
  image = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);
  lastSaved = signal<Date | null>(null);
  userId = this.auth.getUserId();

  isDragging = signal(false);
  isCompressing = signal(false);

  readonly maxChars = 10000;
  readonly maxImageSize = 5 * 1024 * 1024; // 5MB original file
  readonly maxCompressedSize = 2 * 1024 * 1024; // Target 2MB after compression

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
      debounceTime(2000),
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

  load(showLoading = false) {
    // ✅ Don't load while compressing or saving
    if (this.isTyping || this.saving() || this.isCompressing()) return;

    if (showLoading) this.loading.set(true);

    this.api.getScribblePad().subscribe({
      next: (pad) => {
        console.log('📥 Loaded ScribblePad:', {
          contentLength: pad.content?.length || 0,
          hasImage: !!pad.image,
          imageLength: pad.image?.length || 0
        });

        // Always update content
        this.content.set(pad.content || '');
        
        // ⚠️ CRITICAL: Only update image if we're not currently working with one
        if (!this.isCompressing() && !this.saving()) {
          this.image.set(pad.image || null);
        } else {
          console.log('⏭️ Skipping image update (compressing or saving)');
        }
        
        this.lastSaved.set(new Date(pad.updated_at));
        if (showLoading) this.loading.set(false);
      },
      error: (err) => {
        if (showLoading) this.loading.set(false);
        if (err.status === 404) {
          this.content.set('');
          if (!this.isCompressing() && !this.saving()) {
            this.image.set(null);
          }
        } else {
          console.error('❌ Error loading ScribblePad:', err);
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
      this.toast.show(`Character limit of ${this.maxChars} reached.`, 'warning');
      return;
    }

    this.contentChanged.next(newContent);
  }

  save(isAutoSave: boolean = false) {
    if (!this.isLoggedIn()) {
      if (!isAutoSave) this.toast.show('Please log in to save your notes', 'warning');
      return;
    }

    const currentContent = this.content() || '';
    const currentImage = this.image();

    if (currentContent.length > this.maxChars) {
      if (!isAutoSave) {
        this.toast.show(`Your notes are too long to save.`, 'error');
      }
      return;
    }

    console.log('💾 Saving ScribblePad:', {
      contentLength: currentContent.length,
      contentPreview: currentContent.substring(0, 50),
      hasImage: !!currentImage,
      imageLength: currentImage?.length || 0
    });

    this.saving.set(true);
    
    this.api.saveScribblePad(currentContent, currentImage).subscribe({
      next: (pad) => {
        console.log('✅ ScribblePad saved:', {
          id: pad.id,
          contentLength: pad.content?.length || 0,
          hasImage: !!pad.image,
          imageLength: pad.image?.length || 0
        });

        this.lastSaved.set(new Date(pad.updated_at));
        
        if (!isAutoSave) {
          this.toast.show('Notes saved successfully', 'success');
        }
      },
      error: (err) => {
        console.error('❌ Error saving ScribblePad:', err);
        console.error('Error details:', err.error);
        
        if (err.status === 413) {
          this.toast.show('Image too large. Please use a smaller image.', 'error');
        } else if (!isAutoSave) {
          this.toast.show('Failed to save notes', 'error');
        }
      },
      complete: () => {
        this.saving.set(false);
        this.isTyping = false;
        
        // ✅ Wait a bit before restarting polling to allow save to complete
        setTimeout(() => {
          if (!this.isCompressing()) {
            this.startPolling();
          }
        }, 1000);
      }
    });
  }

  clear() {
    if (confirm('Are you sure you want to clear all your notes? This cannot be undone.')) {
      this.content.set('');
      this.image.set(null);
      this.save();
    }
  }

  // ============ IMAGE HANDLING ============

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleImageFile(files[0]);
    }
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleImageFile(input.files[0]);
    }
  }

  handleImageFile(file: File) {
    if (!file.type.startsWith('image/')) {
      this.toast.show('Please upload an image file', 'error');
      return;
    }

    if (file.size > this.maxImageSize) {
      this.toast.show('Image size must be less than 5MB', 'error');
      return;
    }

    console.log('🖼️ Processing image:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // ✅ CRITICAL: Stop polling BEFORE starting compression
    this.stopPolling();
    this.isCompressing.set(true);

    this.compressImage(file)
      .then((base64) => {
        console.log('✅ Image compressed:', {
          originalSize: file.size,
          compressedSize: base64.length,
          compression: Math.round((1 - base64.length / file.size) * 100) + '%'
        });

        // Set image locally
        this.image.set(base64);
        
        // Save immediately
        console.log('💾 Saving with image...');
        return this.saveWithPromise(false);
      })
      .then(() => {
        this.toast.show('Image uploaded successfully', 'success');
      })
      .catch((error) => {
        console.error('❌ Image error:', error);
        this.toast.show('Failed to process image: ' + error.message, 'error');
      })
      .finally(() => {
        this.isCompressing.set(false);
        // Restart polling after everything is done
        this.startPolling();
      });
  }

  // Helper method to convert Observable to Promise for cleaner async/await
  private saveWithPromise(isAutoSave: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const currentContent = this.content() || '';
      const currentImage = this.image();

      this.saving.set(true);
      
      this.api.saveScribblePad(currentContent, currentImage).subscribe({
        next: (pad) => {
          console.log('✅ Image save successful');
          this.lastSaved.set(new Date(pad.updated_at));
          this.saving.set(false);
          resolve();
        },
        error: (err) => {
          console.error('❌ Image save failed:', err);
          this.saving.set(false);
          reject(err);
        }
      });
    });
  }

  private compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const maxWidth = 1920;
          const maxHeight = 1080;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          let quality = 0.9;
          let base64 = canvas.toDataURL('image/jpeg', quality);

          while (base64.length > this.maxCompressedSize && quality > 0.1) {
            quality -= 0.1;
            base64 = canvas.toDataURL('image/jpeg', quality);
          }

          if (base64.length > this.maxCompressedSize) {
            reject(new Error('Image too large even after compression'));
            return;
          }

          resolve(base64);
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  removeImage() {
    if (confirm('Are you sure you want to remove the image?')) {
      this.image.set(null);
      this.save(false);
      this.toast.show('Image removed', 'success');
    }
  }

  // ============ POLLING & STATUS ============

  startPolling() {
    this.stopPolling();
    // ✅ Only start polling if not typing or working with images
    if (!this.isTyping && !this.isCompressing() && !this.saving()) {
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
    if (!this.lastSaved()) return 'Never saved';

    const now = new Date();
    const saved = this.lastSaved()!;
    const diff = now.getTime() - saved.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (this.saving()) return 'Saving...';
    if (this.isCompressing()) return 'Compressing image...';
    if (seconds < 5) return 'Just saved';
    if (this.isTyping) return 'Typing...';

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