import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { FormsModule } from '@angular/forms';
import { Stack } from '../models';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
  <section>
    <h2>Stapel</h2>
    <form (submit)="create($event)">
      <input [(ngModel)]="name" name="name" placeholder="Neuer Stapel" required />
      <button type="submit">Erstellen</button>
    </form>

    <ul>
      <li *ngFor="let s of stacks()">
        <strong>{{s.name}}</strong>
        <a [routerLink]="['/stack', s.id, 'edit']">Bearbeiten</a> ·
        <a [routerLink]="['/stack', s.id, 'study']">Lernen</a> ·
        <button (click)="remove(s)">Löschen</button>
      </li>
    </ul>
  </section>
  `
})
export class StacksPage {
  private api = inject(ApiService);
  stacks = signal<Stack[]>([]);
  name = '';

  constructor(){ this.load(); }
  load(){ this.api.stacks().subscribe(s => this.stacks.set(s)); }
  create(e: Event){ e.preventDefault(); this.api.createStack(this.name).subscribe(()=>{ this.name=''; this.load(); }); }
  remove(s: Stack){ if(confirm('Stapel wirklich löschen?')) this.api.deleteStack(s.id).subscribe(()=>this.load()); }
}