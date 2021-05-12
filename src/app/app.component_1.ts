import {Component} from '@angular/core';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
})
export class AppComponent {
	title = 'ng-doom';
	active = 'app-wad-upload';
	public isMenuCollapsed = true;
	constructor() {
	}


}
