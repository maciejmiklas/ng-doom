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
import {Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core'
import * as T from 'three'

import {WadStorageService} from '../../wad/wad-storage.service'

import {config as GC} from '../../game-config'
import {CameraService} from "../../renderer/camera.service"
import {WorldService} from "../../renderer/world.service"
import {CallbackDispatcherService} from "../../renderer/callback-dispatcher.service"
import {Log} from "../../common/log"

@Component({
	selector: 'app-play',
	templateUrl: './play.component.html',
	styleUrls: ['./play.component.css'],
	standalone: true
})
export class PlayComponent implements OnInit {

	@ViewChild('canvas', {static: true})
	private canvasRef: ElementRef<HTMLCanvasElement>
	private camera: T.PerspectiveCamera
	private scene: T.Scene

	constructor(private wadStorage: WadStorageService,
							private cameraService: CameraService,
							private worldService: WorldService,
							private callback: CallbackDispatcherService) {
	}

	private get canvas(): HTMLCanvasElement {
		return this.canvasRef.nativeElement
	}

	ngOnInit(): void {
		// create
		this.scene = this.worldService.createScene()
		this.camera = this.cameraService.create(this.canvas, this.scene)

		// init
		this.callback.init(this.canvas, this.scene, this.camera)

		// build map
		const wad = this.wadStorage.getCurrent().get().wad
		const foundMap = wad.maps.findIndex(m => m.mapName === GC.game.startMap)
		if (foundMap == -1) {
			Log.error("No such map: ", GC.game.startMap)
			return
		}
		this.callback.buildMap(wad, foundMap, this.scene)

		// start rendering
		this.callback.startRenderLoop()
	}

	@HostListener('window:resize')
	onResize(): void {
		this.callback.onResize(this.canvas.clientWidth, this.canvas.clientHeight)
	}

}
