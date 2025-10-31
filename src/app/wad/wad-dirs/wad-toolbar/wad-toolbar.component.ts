import {AfterViewInit, Component, EventEmitter, Output, ViewChild} from "@angular/core";
import {MatPaginator} from "@angular/material/paginator";

@Component({
  selector: 'wad-toolbar',
  imports: [
    MatPaginator,
  ],
  template: `
    <mat-paginator #paginator [pageSizeOptions]="[5, 10, 25, 100, 1000]"></mat-paginator>
  `
})
export class WadToolbarComponent implements AfterViewInit {
  @Output() paginatorReady = new EventEmitter<MatPaginator>();

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngAfterViewInit(): void {
    this.paginatorReady.emit(this.paginator);
  }
}
