/*
 * Copyright 2025 Maciej Miklas (MIT License)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import {Component, computed, inject, Signal, ViewEncapsulation} from '@angular/core'
import {WadStorageService} from '../wad-storage.service'
import {Directory} from '../parser/wad-model'
import * as R from 'ramda'
import {takeUntilDestroyed, toSignal} from "@angular/core/rxjs-interop";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
  MatTableDataSource
} from "@angular/material/table";
import {ToolbarHostService} from "../../toolbar/toolbar-host.service";
import {WadToolbarComponent} from "./wad-toolbar/wad-toolbar.component";
import {take} from "rxjs";

@Component({
  selector: 'app-wad-dirs',
  styleUrl: './wad-dirs.component.scss',
  template: `
    <table mat-table [dataSource]="dataSource" class="mat-elevation-z8">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let dir">{{ dir.name }}</td>
      </ng-container>

      <ng-container matColumnDef="idx">
        <th mat-header-cell *matHeaderCellDef>IDX</th>
        <td mat-cell *matCellDef="let dir">{{ dir.idx }}</td>
      </ng-container>

      <ng-container matColumnDef="filepos">
        <th mat-header-cell *matHeaderCellDef>Filepos</th>
        <td mat-cell *matCellDef="let dir">{{ dir.filepos }}</td>
      </ng-container>

      <ng-container matColumnDef="size">
        <th mat-header-cell *matHeaderCellDef>Size</th>
        <td mat-cell *matCellDef="let dir">{{ dir.size }}</td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
    </table>
  `,
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [MatTable, MatHeaderCell, MatHeaderCellDef, MatCell, MatCellDef, MatColumnDef, MatHeaderRow, MatRow, MatHeaderRowDef, MatRowDef]
})
export class WadDirsComponent {

  private wadStorage = inject(WadStorageService)
  private readonly wad = toSignal(this.wadStorage.current$)
  readonly dirs: Signal<Directory[]> = computed(() => this.wad()?.wad.dirs ?? [])
  initDirs: Directory[]
  allDirs: Directory[]
  displayedColumns: string[] = ['name', 'idx', 'filepos', 'size']
  dataSource: MatTableDataSource<Directory> = new MatTableDataSource(this.dirs());
  private toolbarHostService = inject(ToolbarHostService)

  constructor() {
    this.toolbarHostService.registerHost(WadToolbarComponent).pipe(takeUntilDestroyed())
      .subscribe(hr => {
          hr.instance.paginatorReady.pipe(take(1))
            .subscribe(pag => this.dataSource.paginator = pag)
        }
      )
  }

  applyFilter(filter: string) {
    if (R.isEmpty(filter)) {
      this.allDirs = this.initDirs
    } else {
      const filterFun = filterDir(filter)
      this.allDirs = R.filter(filterFun, this.initDirs)

    }
  }
}

const filterDir = (filter: string) => (dir: Directory): boolean =>
  (dir.filepos + ',' + dir.name + ',' + dir.idx + ',' + dir.size).toLowerCase().includes(filter.toLowerCase())

