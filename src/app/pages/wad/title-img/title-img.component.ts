import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {functions as wp} from '../../../wad/wad_parser';
import {functions as bp} from '../../../wad/bitmap_parser';

@Component({
	selector: 'app-title-img',
	templateUrl: './title-img.component.html',
	styleUrls: ['./title-img.component.css']
})
export class TitleImgComponent implements OnInit {

	private bytes: Uint8Array;

	constructor(private route: ActivatedRoute) {
	}

	ngOnInit(): void {
		this.route.queryParams.subscribe(params => {
			this.bytes = params.bytes;
		});
	}


	handleShowTitleImage(event: Event): void {
		const file = (event.target as HTMLInputElement).files[0];
		file.arrayBuffer().then(buf => {
			const bytes = Array.from(new Uint8Array(buf));
			const wad = wp.parseWad(bytes).get();
			const palette = bp.parsePlaypal(bytes, wad.dirs).palettes[0];
			const canvas = document.getElementById('imgTag') as HTMLCanvasElement;
			const ctx = canvas.getContext('2d');
			const img = bp.toImageData(wad.title.credit);
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
}
