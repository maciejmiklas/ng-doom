import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {Palette, PatchBitmap} from '../../parser/wad_model';
import {functions as ic} from '../../parser/image_converter';

@Component({
	selector: 'app-pbmp-animation',
	templateUrl: './pbmp-animation.component.html'
})
export class PbmpAnimationComponent implements OnInit {

	@Input()
	bitmaps: PatchBitmap[];

	@Input()
	palette: Palette;

	@Input()
	scale = 1;

	@Input()
	frameDelayMs = 200;

	private bIdx = 0;

	@ViewChild('canvas', {static: true})
	canvasRef: ElementRef<HTMLCanvasElement>;
	private canvas: HTMLCanvasElement;

	private images: BitmapPromise[];

	constructor() {
	}

	ngOnInit(): void {
		this.images = this.bitmaps.map(b => this.createBitmap(b, this.palette));

		this.paintNext();

		if (this.images.length > 1) {
			setInterval(() => {
				this.paintNext();
			}, this.frameDelayMs);
		}
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
		}).catch(e => {/* FIXME console.log('PAINT ERR in:', bp.patch.header.dir.name, ' -> ', e)*/
		});
	}

	private createBitmap(patch: PatchBitmap, palette: Palette): BitmapPromise {
		const width = patch.header.width * this.scale;
		const height = patch.header.height * this.scale;
		return {
			bitmap: ic.toImageBitmap(patch)(width, height)(palette),
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
