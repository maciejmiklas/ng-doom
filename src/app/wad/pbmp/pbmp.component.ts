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
import {Component, DoCheck, ElementRef, Input, KeyValueDiffer, KeyValueDiffers, OnInit, ViewChild} from '@angular/core'
import {RgbaBitmap} from '../parser/wad-model'
import {WadStorageService} from '../wad-storage.service'
import {functions as tp} from '../parser/texture-parser'

@Component({
    selector: 'app-pbmp',
    templateUrl: './pbmp.component.html',
    standalone: true
})
export class PbmpComponent implements OnInit, DoCheck {
	static CMP = 'app-pbmp'

	@Input()
	bitmap: RgbaBitmap

	@ViewChild('canvas', {static: true})
	canvasRef: ElementRef<HTMLCanvasElement>

	@Input()
	reloadBitmap = false

	_maxSize = 100000
	_scale = 1
	private image
	private canvas: HTMLCanvasElement
	private ctx: CanvasRenderingContext2D
	private bitmapDiffer: KeyValueDiffer<RgbaBitmap, any>
	private lastRescale = 1
	private initialized = false

	constructor(private wadStorage: WadStorageService, private differ: KeyValueDiffers) {

	}

	ngOnInit(): void {
		this.canvas = this.canvasRef.nativeElement
		if (!this.reloadBitmap) {
			this.paint()
		}
		this.initialized = true
	}

	@Input()
	set maxSize(maxSize: number) {
		this._maxSize = maxSize
		this.adjustScale()
	}

	@Input()
	set scale(scale: number) {
		this._scale = scale
		this.adjustScale()

		if (this.initialized) {
			this.rescale()
		}
	}

	private adjustScale(): void {
		const maxBitmapSize = Math.max(this.bitmap.width, this.bitmap.height)
		if (this._scale * maxBitmapSize > this._maxSize) {
			this._scale = Math.floor(this._maxSize / maxBitmapSize)
		}
	}

	private rescale(): void {
		if (this.canvas === undefined || this.lastRescale === this._scale) {
			return
		}
		this.lastRescale = this._scale
		this.canvas.width = this.bitmap.width * this._scale
		this.canvas.height = this.bitmap.height * this._scale
		this.ctx.scale(this._scale, this._scale)
		this.ctx.drawImage(this.image, 0, 0)
	}

	private paint(): void {
		this.canvas.width = this.bitmap.width
		this.canvas.height = this.bitmap.height
		this.ctx = this.canvas.getContext('2d')

		this.ctx.putImageData(tp.toImageData(this.bitmap), 0, 0)
		this.image = new Image()
		this.image.onload = () => {
			this.rescale()
		}
		this.image.src = this.canvas.toDataURL()
	}

	ngDoCheck(): void {
		if (this.reloadBitmap && !this.bitmapDiffer) {
			this.bitmapDiffer = this.differ.find(this.bitmap).create()
			this.paint()

		} else if (this.reloadBitmap && this.bitmapDiffer.diff(this.bitmap)) {
			this.paint()
		}
	}
}
