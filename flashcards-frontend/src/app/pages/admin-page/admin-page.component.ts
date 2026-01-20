import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { LoaderComponent } from '../loader/loader.component';
import { FormsModule } from '@angular/forms';

interface User {
  id: number;
  username: string;
  role?: string;
  created_at?: string;
}

interface AdminStack {
  id: string;
  name: string;
  user_id: number;
  owner_name: string;
  is_public: boolean;
  card_amount: number;
  created_at: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, LoaderComponent, FormsModule],
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.scss']
})
export class AdminPage implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  loading = signal(false);
  users = signal<User[]>([]);
  stacks = signal<AdminStack[]>([]);
  
  activeTab: 'users' | 'stacks' = 'users';
  searchTerm = '';
  
  // User management
  selectedUser: User | null = null;
  
  // Stack management
  selectedStack: AdminStack | null = null;

  ngOnInit() {
    this.checkAdminAccess();
    this.loadData();
  }

  checkAdminAccess() {
    const username = this.auth.getUsername();
    if (username !== 'Luca' && username !== 'McLearn') {
      this.toast.show('Access denied. Admin only.', 'error');
      this.router.navigate(['/']);
    }
  }

  loadData() {
    this.loading.set(true);
    
    // Load users
    this.api.adminGetUsers().subscribe({
      next: (users) => {
        this.users.set(users as any);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.toast.show('Failed to load users', 'error');
      }
    });

    // Load stacks
    this.api.adminGetStacks().subscribe({
      next: (stacks) => {
        this.stacks.set(stacks);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading stacks:', err);
        this.toast.show('Failed to load stacks', 'error');
        this.loading.set(false);
      }
    });
  }

  get filteredUsers(): User[] {
    if (!this.searchTerm) return this.users();
    return this.users().filter(u => 
      u.username.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  get filteredStacks(): AdminStack[] {
    if (!this.searchTerm) return this.stacks();
    return this.stacks().filter(s => 
      s.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      s.owner_name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // User actions
  deleteUser(user: User) {
    if (!confirm(`Delete user "${user.username}"? This will delete all their stacks and cards.`)) {
      return;
    }

    this.loading.set(true);
    this.api.adminDeleteUser(user.id).subscribe({
      next: () => {
        this.toast.show(`User "${user.username}" deleted`, 'success');
        this.loadData();
      },
      error: (err) => {
        console.error('Error deleting user:', err);
        this.toast.show('Failed to delete user', 'error');
        this.loading.set(false);
      }
    });
  }

  viewUserStacks(user: User) {
    this.activeTab = 'stacks';
    this.searchTerm = user.username;
  }

  // Stack actions
  deleteStack(stack: AdminStack) {
    if (!confirm(`Delete stack "${stack.name}"? This will delete all its cards.`)) {
      return;
    }

    this.loading.set(true);
    this.api.adminDeleteStack(stack.id).subscribe({
      next: () => {
        this.toast.show(`Stack "${stack.name}" deleted`, 'success');
        this.loadData();
      },
      error: (err) => {
        console.error('Error deleting stack:', err);
        this.toast.show('Failed to delete stack', 'error');
        this.loading.set(false);
      }
    });
  }

  toggleStackVisibility(stack: AdminStack) {
    this.loading.set(true);
    this.api.adminUpdateStack(stack.id, !stack.is_public).subscribe({
      next: () => {
        this.toast.show(
          `Stack "${stack.name}" is now ${!stack.is_public ? 'public' : 'private'}`,
          'success'
        );
        this.loadData();
      },
      error: (err) => {
        console.error('Error updating stack:', err);
        this.toast.show('Failed to update stack', 'error');
        this.loading.set(false);
      }
    });
  }

  transferStack(stack: AdminStack) {
    const newUsername = prompt(`Transfer stack "${stack.name}" to user (username):`);
    if (!newUsername) return;

    this.loading.set(true);
    this.api.adminTransferStack(stack.id, newUsername).subscribe({
      next: () => {
        this.toast.show(`Stack transferred to "${newUsername}"`, 'success');
        this.loadData();
      },
      error: (err) => {
        console.error('Error transferring stack:', err);
        this.toast.show('Failed to transfer stack', 'error');
        this.loading.set(false);
      }
    });
  }

  // Stats
  get totalUsers(): number {
    return this.users().length;
  }

  get totalStacks(): number {
    return this.stacks().length;
  }

  get totalPublicStacks(): number {
    return this.stacks().filter(s => s.is_public).length;
  }

  get totalCards(): number {
    return this.stacks().reduce((sum, s) => sum + (s.card_amount || 0), 0);
  }
}