import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialOptionService } from '../../../services/material-option.service';
import { MaterialOption } from '../../../models/catalog';

/**
 * Multi-select picker for the customizable product "Material" tags (materialOptions collection).
 * Click a tag to toggle it; admins can also add, rename and delete tags inline.
 */
@Component({
  selector: 'ts-material-tag-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-w-0">
      <div class="flex flex-wrap gap-2">
        @for (opt of options; track opt.id) {
          @if (renamingId === opt.id) {
            <span class="inline-flex items-center gap-1 max-w-full">
              <input type="text" [(ngModel)]="renameValue" (keydown.enter)="$event.preventDefault(); saveRename()"
                (keydown.escape)="renamingId = null"
                class="w-36 min-w-0 px-3 py-1 text-sm bg-white border border-neutral-300 rounded-full text-neutral-900 focus:ring-2 focus:ring-ts-accent focus:border-ts-accent">
              <button type="button" (click)="saveRename()"
                class="shrink-0 px-3 py-1 text-xs font-medium rounded-full bg-ts-accent text-white">Guardar</button>
            </span>
          } @else {
            <span class="inline-flex items-center max-w-full rounded-full border text-sm transition-colors"
              [class]="isSelected(opt.id!) ? 'bg-neutral-900 border-neutral-900' : 'bg-white border-neutral-300 hover:border-ts-accent'">
              <button type="button" (click)="toggle(opt.id!)" [attr.aria-pressed]="isSelected(opt.id!)"
                class="px-3 py-1 truncate"
                [class]="isSelected(opt.id!) ? 'text-white' : 'text-neutral-700'">
                {{ isSelected(opt.id!) ? '✓ ' : '' }}{{ opt.name }}
              </button>
              @if (managing) {
                <button type="button" (click)="startRename(opt)" title="Renombrar"
                  class="shrink-0 px-1.5 py-1 text-xs"
                  [class]="isSelected(opt.id!) ? 'text-white/70 hover:text-white' : 'text-neutral-500 hover:text-neutral-900'">✎</button>
                <button type="button" (click)="remove(opt)" title="Eliminar"
                  class="shrink-0 pl-1 pr-2.5 py-1 text-xs text-red-600 hover:text-red-700">✕</button>
              }
            </span>
          }
        } @empty {
          <span class="text-sm text-neutral-500">Sin materiales todavía — añade uno.</span>
        }
      </div>

      <div class="flex flex-wrap items-center gap-2 mt-3">
        <button type="button" (click)="adding = !adding; renamingId = null"
          class="px-3 py-1.5 text-sm font-medium text-ts-accent border border-ts-accent rounded-lg hover:bg-ts-accent/10">
          + Añadir material
        </button>
        @if (options.length) {
          <button type="button" (click)="managing = !managing; renamingId = null"
            class="px-3 py-1.5 text-sm border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50">
            {{ managing ? 'Listo' : 'Editar materiales' }}
          </button>
        }
      </div>

      @if (adding) {
        <div class="flex gap-2 mt-2">
          <input type="text" [(ngModel)]="newName" (keydown.enter)="$event.preventDefault(); add()"
            placeholder="Nombre del material"
            class="flex-1 min-w-0 px-4 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-ts-accent focus:border-ts-accent text-neutral-900">
          <button type="button" (click)="add()"
            class="shrink-0 px-4 py-2 bg-ts-accent text-white rounded-lg text-sm font-medium hover:opacity-90">Guardar</button>
        </div>
      }
      @if (error) {
        <p class="mt-2 text-sm text-red-600">{{ error }}</p>
      }
    </div>
  `
})
export class MaterialTagPickerComponent implements OnInit {
  @Input() selected: string[] = [];
  @Output() selectedChange = new EventEmitter<string[]>();

  private materialOptionService = inject(MaterialOptionService);
  private cdr = inject(ChangeDetectorRef);

  options: MaterialOption[] = [];
  adding = false;
  managing = false;
  newName = '';
  renamingId: string | null = null;
  renameValue = '';
  error = '';

  async ngOnInit() {
    await this.load();
  }

  isSelected(id: string): boolean {
    return this.selected?.includes(id) ?? false;
  }

  toggle(id: string) {
    const next = this.isSelected(id) ? this.selected.filter(s => s !== id) : [...(this.selected || []), id];
    this.emit(next);
  }

  async add() {
    const name = this.newName.trim();
    if (!name) return;
    try {
      const id = await this.materialOptionService.add(name, this.options.length);
      await this.load();
      this.emit([...(this.selected || []), id]);
      this.newName = '';
      this.adding = false;
      this.error = '';
    } catch (err) {
      console.error('Error adding material option:', err);
      this.error = 'No se pudo añadir el material';
    }
    this.cdr.detectChanges();
  }

  startRename(opt: MaterialOption) {
    this.adding = false;
    this.renamingId = opt.id!;
    this.renameValue = opt.name;
  }

  async saveRename() {
    const name = this.renameValue.trim();
    if (!this.renamingId || !name) return;
    try {
      await this.materialOptionService.update(this.renamingId, { name });
      await this.load();
      this.error = '';
    } catch (err) {
      console.error('Error renaming material option:', err);
      this.error = 'No se pudo renombrar el material';
    }
    this.renamingId = null;
    this.cdr.detectChanges();
  }

  async remove(opt: MaterialOption) {
    if (!opt.id) return;
    if (!confirm(`¿Eliminar "${opt.name}"? Los productos que lo usan dejarán de mostrarlo.`)) return;
    try {
      await this.materialOptionService.delete(opt.id);
      this.emit((this.selected || []).filter(s => s !== opt.id));
      await this.load();
      this.error = '';
    } catch (err) {
      console.error('Error deleting material option:', err);
      this.error = 'No se pudo eliminar el material';
    }
    this.cdr.detectChanges();
  }

  private emit(ids: string[]) {
    this.selected = ids;
    this.selectedChange.emit(ids);
  }

  private async load() {
    this.options = await this.materialOptionService.list().catch(() => []);
    this.cdr.detectChanges();
  }
}
