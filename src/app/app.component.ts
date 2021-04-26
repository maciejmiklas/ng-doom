import {Component} from '@angular/core';
import {functions as wp} from './wad/wad_parser';
import {functions as bp} from './wad/bitmap_parser';
import {Palette} from './wad/wad_model';
import {Router} from '@angular/router';

// https://stackblitz.com/edit/canvas-example-angular?file=app%2Fapp.component.ts
@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	title = 'ng-doom';
	palette: Palette | undefined;

	constructor(private router: Router) {
	}

	drawRectangle(): void {
		const canvas = document.getElementById('imgTag') as HTMLCanvasElement;
		const ctx = canvas.getContext('2d');

		ctx.fillStyle = '#D74022';
		ctx.fillRect(25, 25, 150, 150);

		ctx.fillStyle = 'rgba(0,0,0,0.5)';
		ctx.clearRect(60, 60, 120, 120);
		ctx.strokeRect(90, 90, 80, 80);
	}

	handleShowTitleImage(event: Event): void {
		const file = (event.target as HTMLInputElement).files[0];
		file.arrayBuffer().then(buf => {
			const bytes = Array.from(new Uint8Array(buf));
			this.router.navigate(['/wad-title-img'], {queryParams: {flip: 3}});
		});

	}

	handleShowPlaypal(event: Event): void {
		const file = (event.target as HTMLInputElement).files[0];
		file.arrayBuffer().then(buf => {
			const bytes = Array.from(new Uint8Array(buf));
			const wad = wp.parseWad(bytes).get();
			this.palette = bp.parsePlaypal(bytes, wad.dirs).palettes[0];
		});
	}

}
