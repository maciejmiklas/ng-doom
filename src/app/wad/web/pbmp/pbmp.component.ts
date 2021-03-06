import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {PatchBitmap} from '../../parser/wad_model';
import {functions as bp} from '../../parser/bitmap_parser';
import {Log} from '../../../common/is/log';
import {WadStorageService} from '../../service/wad-storage.service';

@Component({
	selector: 'app-pbmp',
	templateUrl: './pbmp.component.html',
	styleUrls: ['./pbmp.component.scss']
})
export class PbmpComponent implements OnInit {
	static CMP = 'app-pbmp';

	@Input()
	bitmap: PatchBitmap;

	@Input()
	palette = 0;

	@ViewChild('canvas', {static: true})
	canvasRef: ElementRef<HTMLCanvasElement>;

	_scale = 1;
	private ctx;
	private imageObject;
	private canvas;

	constructor(private wadStorage: WadStorageService) {
	}

	ngOnInit(): void {
		this.paint();
	}

	@Input()
	set scale(scale: number) {
		if (this._scale !== scale) {
			this._scale = scale;
			this.rescale();
		}
	}

	private rescale(): void {
		if (this.canvas === undefined) {
			return;
		}
		const canvas = this.canvasRef.nativeElement;
		canvas.width = this.bitmap.header.width * this._scale;
		canvas.height = this.bitmap.header.height * this._scale;
		this.ctx.scale(this._scale, this._scale);
		this.ctx.drawImage(this.imageObject, 0, 0);
	}

	private paint(): void {
		if (!this.wadStorage.isLoaded()) {
			Log.error(PbmpComponent.CMP, 'WAD not Loaded');
			return;
		}
		const wad = this.wadStorage.getCurrent().get().wad;
		const palette = bp.parsePlaypal(wad.bytes, wad.dirs).palettes[this.palette];
		this.canvas = this.canvasRef.nativeElement;
		this.ctx = this.canvas.getContext('2d');
		const img = bp.toImageData(this.bitmap);
		this.canvas.width = this.bitmap.header.width * this._scale;
		this.canvas.height = this.bitmap.header.height * this._scale;
		this.ctx.putImageData(img(palette), 0, 0);

		this.imageObject = new Image();
		this.imageObject.onload = () => {
			this.ctx.scale(this._scale, this._scale);
			this.ctx.drawImage(this.imageObject, 0, 0);
		};
		this.imageObject.src = this.canvas.toDataURL();
	}
}
