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
import {Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core'
import * as T from 'three'

import {WadStorageService} from '../../wad/wad-storage.service'

import {config as GC} from '../../game-config'
import {CameraService} from "../../renderer/camera.service";
import {WorldService} from "../../renderer/world.service";
import {CallbackDispatcherService} from "../../renderer/callback-dispatcher.service";
import {Log} from "../../common/log";

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

		//init
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
