import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-listado',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-7xl mx-auto px-6 py-16">
      <h2 class="font-serif text-3xl mb-6 text-ts-ink">Productos</h2>
      <div class="flex gap-3 mb-8">
        <a routerLink="/productos/12mm" class="px-4 py-2 rounded-full ring-1 ring-ts-line hover:bg-ts-paper hover:text-ts-bg transition-colors">12mm</a>
        <a routerLink="/productos/20mm" class="px-4 py-2 rounded-full ring-1 ring-ts-line hover:bg-ts-paper hover:text-ts-bg transition-colors">20mm</a>
      </div>
      <router-outlet></router-outlet>
    </div>
  `
})
export class ListadoComponent {}