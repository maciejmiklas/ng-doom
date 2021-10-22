import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {PatchBitmap} from '../../parser/wad_model';
import {functions as bp} from '../../parser/bitmap_parser';
import {functions as bc} from '../../parser/bitmap_converter';
import {WadStorageService} from '../../service/wad-storage.service';

@Component({
	selector: 'app-pbmp-animation',
	templateUrl: './pbmp-animation.component.html'
})
export class PbmpAnimationComponent implements OnInit {

	@Input()
	bitmaps: PatchBitmap[];

	@Input()
	palette = 0;

	@Input()
	scale = 1;

	@Input()
	frameDelayMs = 200;

	private bIdx = 0;

	@ViewChild('canvas', {static: true})
	canvasRef: ElementRef<HTMLCanvasElement>;
	private canvas: HTMLCanvasElement;

	constructor(private wadStorage: WadStorageService) {
	}

	ngOnInit(): void {
		this.paintNext();

		setInterval(() => {
			this.paintNext();
		}, this.frameDelayMs);
	}

	private paintNext(): void {
		this.paint(this.bitmaps[this.bIdx++]);
		if (this.bIdx === this.bitmaps.length) {
			this.bIdx = 0;
		}
	}

	private paint(bitmap: PatchBitmap): void {
		const wad = this.wadStorage.getCurrent().get().wad;
		const palette = bp.parsePlaypal(wad.bytes, wad.dirs).palettes[this.palette];
		this.canvas = this.canvasRef.nativeElement;
		bc.paintOnCanvas(bitmap, this.canvas)(palette)(this.scale);
	}

}
