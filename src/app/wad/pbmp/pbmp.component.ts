import {Component, DoCheck, ElementRef, Input, KeyValueDiffer, KeyValueDiffers, OnInit, ViewChild} from '@angular/core';
import {PatchBitmap} from '../parser/wad-model';
import {functions as ic} from '../parser/image-converter';
import {WadStorageService} from '../wad-storage.service';

@Component({
	selector: 'app-pbmp',
	templateUrl: './pbmp.component.html'
})
export class PbmpComponent implements OnInit, DoCheck {
	static CMP = 'app-pbmp';

	@Input()
	bitmap: PatchBitmap;

	@Input()
	palette = 0;

	@ViewChild('canvas', {static: true})
	canvasRef: ElementRef<HTMLCanvasElement>;

	@Input()
	reloadBitmap = false;

	@Input()
	maxSize = 1000;

	_scale = 1;
	private ctx;
	private imageObject;
	private canvas: HTMLCanvasElement;
	private bitmapDiffer: KeyValueDiffer<PatchBitmap, any>;

	constructor(private wadStorage: WadStorageService, private differ: KeyValueDiffers) {
	}

	ngOnInit(): void {
		if (!this.reloadBitmap) {
			this.paint();
		}
		this.bitmapDiffer = this.differ.find(this.bitmap).create();
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
		const wad = this.wadStorage.getCurrent().get().wad;
		const palette = wad.playpal.palettes[this.palette];
		this.canvas = this.canvasRef.nativeElement;
		this.ctx = this.canvas.getContext('2d');
		this.imageObject = ic.paintOnCanvasForZoom(this.bitmap, this.canvas)(palette)(this._scale, this.maxSize);
	}

	ngDoCheck(): void {
		if (this.reloadBitmap && this.bitmapDiffer.diff(this.bitmap)) {
			this.paint();
		}
	}
}
