import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {PatchBitmap} from '../../parser/wad_model';
import {functions as bp} from '../../parser/bitmap_parser';
import {Log} from '../../../common/is/log';
import {WadStorageService} from '../../service/wad-storage.service';

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

	constructor(private wadStorage: WadStorageService) {
	}

	ngOnInit(): void {
		if (!this.wadStorage.isLoaded()) {
			Log.error(PbmpComponent.CMP, 'WAD not Loaded');
			return;
		}
		this.paint();
	}

	private paint(): void {
		const wad = this.wadStorage.getCurrent().get().wad;
		const palette = bp.parsePlaypal(wad.bytes, wad.dirs).palettes[this.palette];
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
