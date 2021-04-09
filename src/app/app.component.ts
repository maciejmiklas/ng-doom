import {Component} from '@angular/core';
import {functions as wp} from './wad/wad_parser';
import {functions as bc} from './wad/bitmap_converter';

// https://stackblitz.com/edit/canvas-example-angular?file=app%2Fapp.component.ts
@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	title = 'ng-doom';
	b64 = 'none';

	drawRectangle(): void {
		const canvas = document.getElementById('imgTag') as HTMLCanvasElement;
		const ctx = canvas.getContext('2d');

		ctx.fillStyle = '#D74022';
		ctx.fillRect(25, 25, 150, 150);

		ctx.fillStyle = 'rgba(0,0,0,0.5)';
		ctx.clearRect(60, 60, 120, 120);
		ctx.strokeRect(90, 90, 80, 80);
	}

	handleFileInput(event: Event): void {
		const file = (event.target as HTMLInputElement).files[0];
		file.arrayBuffer().then(buf => {
			const wad = wp.parseWad(Array.from(new Uint8Array(buf))).get();
			const img = bc.toImageData(wad.title.title);
			const canvas = document.getElementById('imgTag') as HTMLCanvasElement;
			const ctx = canvas.getContext('2d');
			ctx.putImageData(img, 0, 0);
			console.log('WAD');
		});
	}
}
