import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {MatSidenav, MatSidenavContainer, MatSidenavContent} from "@angular/material/sidenav";
import {MatToolbar} from "@angular/material/toolbar";
import {MatIconButton} from "@angular/material/button";
import {MenuComponent} from "./menu/menu.component";

@Component({
	selector: 'app-root',
	imports: [RouterOutlet, MatSidenavContainer, MatSidenav, MatSidenavContent, MatToolbar, MatIconButton, MenuComponent],
	template: `
		<mat-sidenav-container>
			<mat-sidenav #sidenav mode="side" opened>
				<app-menu></app-menu>
			</mat-sidenav>

			<mat-sidenav-content>
				<mat-toolbar color="primary">
					<button mat-icon-button (click)="sidenav.toggle()">H</button>
					<span>My App</span>
				</mat-toolbar>

				<main class="content">
					CONTENT
					<router-outlet></router-outlet>
				</main>
			</mat-sidenav-content>
		</mat-sidenav-container>
		r`,
	styleUrl: '../scss/ng-doom.scss'
})
export class AppComponent {
}
