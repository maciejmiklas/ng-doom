import {Component} from '@angular/core';
import {Palette} from './wad/wad_model';
import {Router} from '@angular/router';
import {CurrentWadService} from './wad/current-wad.service';

// https://stackblitz.com/edit/canvas-example-angular?file=app%2Fapp.component.ts
@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	title = 'ng-doom';
	palette: Palette | undefined;

	constructor(private router: Router, private currentWadService: CurrentWadService) {
	}

	handleUploadWad(event: Event): void {
		const file = (event.target as HTMLInputElement).files[0];
		file.arrayBuffer().then(buf => {
			this.currentWadService.load(Array.from(new Uint8Array(buf)));
		});
	}

}
