import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, of, tap } from 'rxjs';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'https://mclearn-server.onrender.com/api';

  // ✅ FIX: Initialisiere mit false, dann im constructor prüfen
  private loggedIn$ = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.loggedIn$.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // ✅ FIX: Auth-Status NACH der Initialisierung prüfen
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    try {
      // Prüfe ob localStorage verfügbar ist (Browser-Umgebung)
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const isAuthenticated = this.checkAuthStatus();
        this.loggedIn$.next(isAuthenticated);
      }
    } catch (error) {
      console.error('Error initializing auth state:', error);
      this.loggedIn$.next(false);
    }
  }

  private checkAuthStatus(): boolean {
    try {
      const token = localStorage.getItem('token');
      const expiry = Number(localStorage.getItem('tokenExpiry'));
      
      if (!token || !expiry) {
        return false;
      }
      
      if (Date.now() > expiry) {
        // Token abgelaufen, cleanup
        this.clearAuthData();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking auth status:', error);
      return false;
    }
  }

  login(username: string, password: string) {
    return this.http
      .post<{ token: string }>(`${this.apiUrl}/login`, { username, password })
      .pipe(tap((res) => this.storeToken(res.token)));
  }

  /** Immer boolean liefern */
  loginGuest(): Observable<boolean> {
    return this.login('Gast', 'gast').pipe(
      map(() => true),
      catchError((err) => {
        console.warn('Gast-Login fehlgeschlagen:', err);
        return of(false);
      })
    );
  }

  register(username: string, password: string) {
    return this.http.post(`${this.apiUrl}/register`, { username, password });
  }

  /** Immer Observable<boolean> zurückgeben */
  ensureAuth(): Observable<boolean> {
    if (!this.isLoggedIn()) {
      return this.loginGuest();
    }
    return of(true);
  }

  isLoggedIn(): boolean {
    try {
      if (typeof localStorage === 'undefined') {
        return false;
      }
      
      const token = localStorage.getItem('token');
      const expiry = Number(localStorage.getItem('tokenExpiry'));
      
      if (!token || !expiry) {
        return false;
      }
      
      if (Date.now() > expiry) {
        this.clearAuthData();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in isLoggedIn:', error);
      return false;
    }
  }

  getToken(): string | null {
    try {
      if (typeof localStorage === 'undefined') {
        return null;
      }
      return this.isLoggedIn() ? localStorage.getItem('token') : null;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  getUsername(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return this.decodeToken(token).username;
    } catch (error) {
      console.error('Error getting username:', error);
      return null;
    }
  }

  getUserId(): number | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return this.decodeToken(token).id;
    } catch (error) {
      console.error('Error getting user id:', error);
      return null;
    }
  }

  getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return this.decodeToken(token).role;
    } catch (error) {
      console.error('Error getting role:', error);
      return null;
    }
  }

  private storeToken(token: string): void {
    try {
      if (typeof localStorage === 'undefined') {
        console.warn('localStorage not available');
        return;
      }
      
      localStorage.setItem('token', token);
      const decoded = this.decodeToken(token);
      const expiry = decoded.exp * 1000;
      localStorage.setItem('tokenExpiry', expiry.toString());
      this.loggedIn$.next(true);
    } catch (error) {
      console.error('Error storing token:', error);
    }
  }

  private clearAuthData(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiry');
      }
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  logout(): void {
    try {
      this.clearAuthData();
      this.loggedIn$.next(false);
      this.router.navigateByUrl('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  private decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      console.error('Error decoding token:', error);
      throw error;
    }
  }

  // Hilfsmethode zum manuellen Refresh des Auth-Status
  refreshAuthState(): void {
    this.initializeAuthState();
  }
}