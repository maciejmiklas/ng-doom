import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {PatchBitmap} from '../../../wad/parser/wad_model';
import {functions as bp} from '../../parser/bitmap_parser';
import {CurrentWadService} from '../../service/current-wad.service';
import {Log} from '../../../common/is/log';

@Component({
	selector: 'app-pbmp',
	templateUrl: './pbmp.component.html'
})
export class PbmpComponent implements OnInit {
	static CMP = 'app-pbmp';

	@Input()
	bitmap: PatchBitmap;

	@Input()
	palette = 0;

	@ViewChild('canvas', { static: true })
	canvasRef: ElementRef<HTMLCanvasElement>;

	constructor(private currentWadService: CurrentWadService) {
	}

	ngOnInit(): void {
		if (!this.currentWadService.isLoaded()) {
			Log.error(PbmpComponent.CMP, 'WAD not Loaded');
			return;
		}
		this.paint();
	}

	private paint(): void {
		const bytes = this.currentWadService.bytes;
		const wad = this.currentWadService.wad;
		const palette = bp.parsePlaypal(bytes, wad.dirs).palettes[this.palette];
		const canvas = this.canvasRef.nativeElement;
		const ctx = canvas.getContext('2d');
		const img = bp.toImageData(this.bitmap);
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
