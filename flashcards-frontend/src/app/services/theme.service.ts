import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private colorTheme: 'dark-theme' | 'light-theme' | undefined;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  initTheme() {
    const theme = localStorage.getItem('user-theme');
    if (theme === 'dark-theme' || theme === 'light-theme') {
      this.update(theme);
    }
  }

  update(theme: 'dark-theme' | 'light-theme') {
    this.colorTheme = theme;
    localStorage.setItem('user-theme', theme);
    if (theme === 'dark-theme') {
      this.renderer.addClass(document.body, 'dark-theme');
    } else {
      this.renderer.removeClass(document.body, 'dark-theme');
    }
  }

  isDarkMode() {
    return this.colorTheme === 'dark-theme';
  }

  toggleTheme() {
    this.isDarkMode() ? this.update('light-theme') : this.update('dark-theme');
  }
}
