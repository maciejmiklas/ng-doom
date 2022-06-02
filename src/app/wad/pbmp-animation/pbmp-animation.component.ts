/*
 * Copyright 2002-2019 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {Bitmap} from '../parser/wad-model';
import {functions as tp} from '../parser/texture-parser';

@Component({
	selector: 'app-pbmp-animation',
	templateUrl: './pbmp-animation.component.html'
})
export class PbmpAnimationComponent implements OnInit {

	@Input()
	bitmaps: Bitmap[];

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
		this.images = this.bitmaps.map(b => this.createBitmap(b));

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

	private createBitmap(patch: Bitmap): BitmapPromise {
		const width = patch.header.width * this.scale;
		const height = patch.header.height * this.scale;
		return {
			bitmap: tp.toImageBitmap(patch)(width, height),
			patch,
			width,
			height,
		};
	}
}

export type BitmapPromise = {
	bitmap: Promise<ImageBitmap>,
	patch: Bitmap,
	width: number,
	height: number
}
