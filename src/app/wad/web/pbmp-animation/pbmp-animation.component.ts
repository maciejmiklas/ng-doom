import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {Palette, PatchBitmap} from '../../parser/wad_model';
import {functions as bp} from '../../parser/bitmap_parser';
import {functions as bc} from '../../parser/bitmap_converter';
import {WadStorageService} from '../../service/wad-storage.service';
import {Either} from '@maciejmiklas/functional-ts';

@Component({
	selector: 'app-pbmp-animation',
	templateUrl: './pbmp-animation.component.html'
})
export class PbmpAnimationComponent implements OnInit {

	@Input()
	bitmaps: PatchBitmap[];

	@Input()
	paletteIdx = 0;

	@Input()
	scale = 1;

	@Input()
	frameDelayMs = 200;

	private bIdx = 0;

	@ViewChild('canvas', {static: true})
	canvasRef: ElementRef<HTMLCanvasElement>;
	private canvas: HTMLCanvasElement;

	private images: BitmapPromise[];

	constructor(private wadStorage: WadStorageService) {
	}

	ngOnInit(): void {
		const wad = this.wadStorage.getCurrent().get().wad;
		const palette = bp.parsePlaypal(wad.bytes, wad.dirs).palettes[this.paletteIdx];
		this.images = this.bitmaps.map(b => this.createBitmap(b, palette));

		this.paintNext();

		setInterval(() => {
			this.paintNext();
		}, this.frameDelayMs);
	}

	private paintNext(): void {
		this.paint(this.images[this.bIdx++]);
		if (this.bIdx === this.bitmaps.length) {
			this.bIdx = 0;
		}
	}

	private paint(bp: BitmapPromise): void {
		this.canvas = this.canvasRef.nativeElement;
		this.canvas.width = bp.width;
		this.canvas.height = bp.height;

		const ctx = this.canvas.getContext('2d');

		bp.bitmap.then(r => {
			ctx.drawImage(r, 0, 0);
		}).catch(e => {} /* FIXME console.log('PAINT ERR in:', bp.patch.header.dir.name, ' -> ', e)*/);
	}

	private createBitmap(patch: PatchBitmap, palette: Palette): BitmapPromise {
		const width = patch.header.width * this.scale;
		const height = patch.header.width * this.scale;
		return {
			bitmap: bc.toImageBitmap(patch)(width, height)(palette),
			patch,
			width,
			height,
		};
	}
}

export type BitmapPromise = {
	bitmap: Promise<ImageBitmap>,
	patch: PatchBitmap,
	width: number,
	height: number
}
