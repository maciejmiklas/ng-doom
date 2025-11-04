import {AfterViewInit, Component, EventEmitter, Output, ViewChild, ViewEncapsulation} from "@angular/core";
import {MatPaginator} from "@angular/material/paginator";
import {MatInput} from "@angular/material/input";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {debounceTime, distinctUntilChanged} from "rxjs";

@Component({
  selector: 'wad-toolbar',
  imports: [
    MatPaginator,
    MatInput,
    ReactiveFormsModule,
  ],
  template: `
    <div class="toolbar-row">
      <input matInput [formControl]="search" placeholder="Type to search..." #input>
      <mat-paginator [pageSizeOptions]="[5, 10, 25, 100, 1000]"></mat-paginator>
    </div>
  `,
  styleUrl: './wad-toolbar.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class WadToolbarComponent implements AfterViewInit {
  @Output() paginatorReady: EventEmitter<MatPaginator> = new EventEmitter<MatPaginator>();
  @Output() filterText: EventEmitter<string> = new EventEmitter<string>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  readonly search = new FormControl('');

  constructor() {
    this.search.valueChanges
      .pipe(
        debounceTime(300), // delay after the last keystroke
        distinctUntilChanged() // ignore same consecutive values
      )
      .subscribe(value => {
        this.filterText.emit(value);
      });
  }

  ngAfterViewInit(): void {
    this.paginatorReady.emit(this.paginator);
  }

}
