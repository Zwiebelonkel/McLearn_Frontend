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
  `
})
class AppRoot {}

bootstrapApplication(AppRoot, appConfig);
