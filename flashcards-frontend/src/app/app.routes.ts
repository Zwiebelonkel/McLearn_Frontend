import { Routes } from '@angular/router';
import { StacksPage } from './pages/stacks-page/stacks-page.component';
import { EditorPage } from './pages/editor-page/editor-page.component';
import { StudyPage } from './pages/study-page/study-page.component';
import { HelpPageComponent } from './pages/help-page/help-page.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ProfilePageComponent } from './pages/profile-page/profile-page.component';
import { authGuard } from './guards/auth.guard';
import { FriendsPageComponent } from './pages/friends-page/friends-page.component';

export const routes: Routes = [
  { path: '', component: StacksPage },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'profile', component: ProfilePageComponent, canActivate: [authGuard] },
  { path: 'friends', component: FriendsPageComponent, canActivate: [authGuard] },
  { path: 'stack/:id/edit', component: EditorPage },
  { path: 'stack/:id/study', component: StudyPage },
  { path: 'help', component: HelpPageComponent },
  { path: '**', redirectTo: '' }
];
