import { Injectable } from '@angular/core';
import { Auth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, User } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private user$: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);

  constructor(private auth: Auth) {
    onAuthStateChanged(this.auth, user => {
      this.user$.next(user);
    });
  }

  login() {
    return signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  logout() {
    return this.auth.signOut();
  }

  getUser() {
    return this.user$.asObservable();
  }
}
