import {Component, OnInit} from '@angular/core';
import {functions as bp} from '../../../wad/bitmap_parser';
import {CurrentWadService} from '../../../wad/current-wad.service';
import {PatchBitmap} from '../../../wad/wad_model';

@Component({
	selector: 'app-title-img',
	templateUrl: './title-img.component.html',
	styleUrls: ['./title-img.component.css']
})
export class TitleImgComponent implements OnInit {

	constructor(private currentWadService: CurrentWadService) {
	}

	ngOnInit(): void {
		if (!this.currentWadService.isLoaded()) {
			return;
		}
		const wad = this.currentWadService.wad;
		this.paint('titleImg', wad.title.title);
		this.paint('creditImg', wad.title.credit);
		this.paint('help0Img', wad.title.help.get()[0]);
		this.paint('help1Img', wad.title.help.get()[1]);
	}

	private paint(imageEl: string, bitmap: PatchBitmap): void {
		const bytes = this.currentWadService.bytes;
		const wad = this.currentWadService.wad;
		const palette = bp.parsePlaypal(bytes, wad.dirs).palettes[0];
		const canvas = document.getElementById(imageEl) as HTMLCanvasElement;
		const ctx = canvas.getContext('2d');
		const img = bp.toImageData(bitmap);
		canvas.width = 960;
		canvas.height = 600;
		ctx.putImageData(img(palette), 0, 0);

		const imageObject = new Image();
		imageObject.onload = () => {
			ctx.scale(3, 3);
			ctx.drawImage(imageObject, 0, 0);
		};
		imageObject.src = canvas.toDataURL();
	}
}
