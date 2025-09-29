import { bootstrapApplication } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { appConfig } from './app/app.config';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <main class="container">
      <h1>📚 Flashcards</h1>
      <router-outlet/>
    </main>
  `,
  styles: [`.container{max-width:900px;margin:24px auto;padding:0 12px;font-family:system-ui,sans-serif}`]
})
class AppRoot {}

bootstrapApplication(AppRoot, appConfig);
