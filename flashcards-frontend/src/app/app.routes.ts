import { Routes } from '@angular/router';
import { StacksPage } from './pages/stacks-page.component';
import { EditorPage } from './pages/editor-page.component';
import { StudyPage } from './pages/study-page.component';

export const routes: Routes = [
  { path: '', component: StacksPage },
  { path: 'stack/:id/edit', component: EditorPage },
  { path: 'stack/:id/study', component: StudyPage },
  { path: '**', redirectTo: '' }
];
