import {Component, ViewChild} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {MatSidenav, MatSidenavContainer, MatSidenavContent} from "@angular/material/sidenav";
import {MenuComponent} from "./menu/menu.component";
import {ToolbarComponent} from "./toolbar/toolbar.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatSidenavContainer, MatSidenav, MatSidenavContent, MenuComponent, ToolbarComponent],
  template: `
    <mat-sidenav-container>
      <mat-sidenav #sidenav mode="side" opened>
        <app-menu></app-menu>
      </mat-sidenav>

      <mat-sidenav-content>
        <app-toolbar (hideButtonClick)="onExpandClick($event)"></app-toolbar>
        <main class="content">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styleUrl: '../scss/ng-doom.scss'
})
export class AppComponent {
  @ViewChild('sidenav', {static: true})
  private sidenav!: MatSidenav;

  onExpandClick(open: boolean) {
    void this.sidenav.toggle(open);
  }

}
