import {Component, ViewEncapsulation} from '@angular/core';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	encapsulation : ViewEncapsulation.None // TODO - CSS is being ignored in Emulated, why?
})
export class AppComponent {
	constructor() {
	}
}
