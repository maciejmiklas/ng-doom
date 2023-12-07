/*
 * Copyright 2022 Maciej Miklas (MIT License)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core'
import {Bitmap} from '../parser/wad-model'
import {functions as tp} from '../parser/texture-parser'
import {Log} from "../../common/log"

@Component({
    selector: 'app-pbmp-animation',
    templateUrl: './pbmp-animation.component.html',
    standalone: true
})
export class PbmpAnimationComponent implements OnInit {

	@Input()
	bitmaps: Bitmap[]

	@Input()
	scale = 1

	@Input()
	frameDelayMs = 200

	private bIdx = 0

	@ViewChild('canvas', {static: true})
	canvasRef: ElementRef<HTMLCanvasElement>
	private canvas: HTMLCanvasElement

	private images: BitmapPromise[]

	ngOnInit(): void {
		this.images = this.bitmaps.map(b => this.createBitmap(b))

		this.paintNext()

		if (this.images.length > 1) {
			setInterval(() => {
				this.paintNext()
			}, this.frameDelayMs)
		}
	}

	private paintNext(): void {
		this.paint(this.images[this.bIdx++])
		if (this.bIdx === this.bitmaps.length) {
			this.bIdx = 0
		}
	}

	private paint(bp: BitmapPromise): void {
		this.canvas = this.canvasRef.nativeElement
		this.canvas.width = bp.width
		this.canvas.height = bp.height
		const ctx = this.canvas.getContext('2d')
		bp.bitmap.then(r => {
			ctx.drawImage(r, 0, 0)
		}).catch(e => {
			Log.error("PAINT ERR", e) // FIXME - fix this error
		})
	}

	private createBitmap(patch: Bitmap): BitmapPromise {
		const width = patch.header.width * this.scale
		const height = patch.header.height * this.scale
		return {
			bitmap: tp.toImageBitmap(patch)(width, height),
			patch,
			width,
			height,
		}
	}
}

export type BitmapPromise = {
	bitmap: Promise<ImageBitmap>,
	patch: Bitmap,
	width: number,
	height: number
}
