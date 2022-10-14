/*
 * Copyright 2022 Maciej Miklas
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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
import {Component, DoCheck, ElementRef, Input, KeyValueDiffer, KeyValueDiffers, OnInit, ViewChild} from '@angular/core'
import {Bitmap, RgbaBitmap} from '../parser/wad-model'
import {WadStorageService} from '../wad-storage.service'
import {functions as tp} from '../parser/texture-parser'

@Component({
	selector: 'app-pbmp',
	templateUrl: './pbmp.component.html'
})
export class PbmpComponent implements OnInit, DoCheck {
	static CMP = 'app-pbmp'

	@Input()
	bitmap: RgbaBitmap

	@Input()
	palette = 0

	@ViewChild('canvas', {static: true})
	canvasRef: ElementRef<HTMLCanvasElement>

	@Input()
	reloadBitmap = false

	@Input()
	maxSize = 1000

	_scale = 1
	private ctx
	private imageObject
	private canvas: HTMLCanvasElement
	private bitmapDiffer: KeyValueDiffer<RgbaBitmap, any>

	constructor(private wadStorage: WadStorageService, private differ: KeyValueDiffers) {
	}

	ngOnInit(): void {
		if (!this.reloadBitmap) {
			this.paint()
		}
		this.bitmapDiffer = this.differ.find(this.bitmap).create()
	}

	@Input()
	set scale(scale: number) {
		if (this._scale !== scale) {
			this._scale = scale
			this.rescale()
		}
	}

	private rescale(): void {
		if (this.canvas === undefined) {
			return
		}
		const canvas = this.canvasRef.nativeElement
		canvas.width = this.bitmap.width * this._scale
		canvas.height = this.bitmap.height * this._scale
		this.ctx.scale(this._scale, this._scale)
		this.ctx.drawImage(this.imageObject, 0, 0)
	}

	private paint(): void {
		this.canvas = this.canvasRef.nativeElement
		this.ctx = this.canvas.getContext('2d')
		this.imageObject = tp.paintOnCanvasForZoom(this.bitmap, this.canvas)(this._scale, this.maxSize)
	}

	ngDoCheck(): void {
		if (this.reloadBitmap && this.bitmapDiffer.diff(this.bitmap)) {
			this.paint()
		}
	}
}
