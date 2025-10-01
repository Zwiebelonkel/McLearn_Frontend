import { Routes } from '@angular/router';
import { StacksPage } from './pages/stacks-page/stacks-page.component';
import { EditorPage } from './pages/editor-page/editor-page.component';
import { StudyPage } from './pages/study-page/study-page.component';
import { HelpPageComponent } from './pages/help-page/help-page.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';

export const routes: Routes = [
  { path: '', component: StacksPage },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'stack/:id/edit', component: EditorPage },
  { path: 'stack/:id/study', component: StudyPage },
  { path: 'help', component: HelpPageComponent },
  { path: '**', redirectTo: '' }
];
