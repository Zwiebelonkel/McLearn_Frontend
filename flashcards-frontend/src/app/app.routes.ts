import { Routes } from '@angular/router';
import { StacksPage } from './pages/stacks-page/stacks-page.component';
import { EditorPage } from './pages/editor-page/editor-page.component';
import { StudyPage } from './pages/study-page/study-page.component';
import { HelpPageComponent } from './pages/help-page/help-page.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ProfilePageComponent } from './pages/profile-page/profile-page.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { maintenanceGuard } from './guards/maintenance.guard';
import { FriendsPageComponent } from './pages/friends-page/friends-page.component';
import { ScribblePadPage } from './pages/scribblepad-page/scribble-page.component';
import { LogoutComponent } from './pages/logout/logout.component';
import { QuizModePage } from './pages/quiz-mode/quiz-mode-page.component';
import { AdminPage } from './pages/admin-page/admin-page.component';

export const routes: Routes = [
  { 
    path: '', 
    component: StacksPage,
    canActivate: [maintenanceGuard]
  },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'logout', 
    component: LogoutComponent,
    canActivate: [maintenanceGuard]
  },
  {
    path: 'profile',
    component: ProfilePageComponent,
    canActivate: [authGuard, maintenanceGuard],
  },
  {
    path: 'scribblepad',
    component: ScribblePadPage,
    canActivate: [authGuard, maintenanceGuard],
  },
  {
    path: 'profile/:id',
    component: ProfilePageComponent,
    canActivate: [authGuard, maintenanceGuard],
  },
  {
    path: 'friends',
    component: FriendsPageComponent,
    canActivate: [authGuard, maintenanceGuard],
  },
  {
    path: 'admin',
    component: AdminPage,
    canActivate: [adminGuard],
  },
  { 
    path: 'stack/:id/edit', 
    component: EditorPage,
    canActivate: [maintenanceGuard]
  },
  { 
    path: 'stack/:id/study', 
    component: StudyPage,
    canActivate: [maintenanceGuard]
  },
  { 
    path: 'stack/:id/quiz', 
    component: QuizModePage,
    canActivate: [maintenanceGuard]
  },
  { 
    path: 'help', 
    component: HelpPageComponent,
    canActivate: [maintenanceGuard]
  },
  { path: '**', redirectTo: '' },
];