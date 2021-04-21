import {Component} from '@angular/core';
import {functions as wp} from './wad/wad_parser';
import {functions as bp} from './wad/bitmap_parser';
import {Palette} from './wad/wad_model';

// https://stackblitz.com/edit/canvas-example-angular?file=app%2Fapp.component.ts
@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	title = 'ng-doom';
	palette: Palette | undefined;

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
			const wad = wp.parseWad(bytes).get();
			const palette = bp.parsePlaypal(bytes, wad.dirs).palettes[0];
			const canvas = document.getElementById('imgTag') as HTMLCanvasElement;
			const ctx = canvas.getContext('2d');
			const img = bp.toImageData(wad.title.title);
			canvas.width = 960;
			canvas.height = 600;
			ctx.putImageData(img(palette), 0, 0);

			const imageObject = new Image();
			imageObject.onload = () => {
				ctx.scale(3, 3);
				ctx.drawImage(imageObject, 0, 0);
			};
			imageObject.src = canvas.toDataURL();
		});
	}

	handleShowPlaypal(event: Event): void {
		const file = (event.target as HTMLInputElement).files[0];
		file.arrayBuffer().then(buf => {
			const bytes = Array.from(new Uint8Array(buf));
			const wad = wp.parseWad(bytes).get();
			this.palette = bp.parsePlaypal(bytes, wad.dirs).palettes[0];
			/*
			const canvas = document.getElementById('imgTag') as HTMLCanvasElement;
			const ctx = canvas.getContext('2d');
			const rSize = 40;
			canvas.width = rSize * 16;
			canvas.height = rSize * 16;
			let idx = 0;
			for (let x = 0; x < 16; x++) {
				for (let y = 0; y < 1; y++) {
					const rgb = palette.colors[idx++];
					ctx.fillStyle = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',1)';
					// ctx.fillRect(x * rSize, y * rSize, rSize, rSize);

					// ctx.fillStyle = 'rgba(0,0,0,1)';
					ctx.fillText('' + idx, x * (rSize / 2), y * (rSize / 2), 20);
				}
			}*/
		});
	}

}
