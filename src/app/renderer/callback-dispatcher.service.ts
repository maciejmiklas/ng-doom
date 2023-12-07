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
import {Injectable} from '@angular/core'
import {
	BuildMapCallback,
	DisposeCallback,
	InitCallback,
	RenderCallback,
	StartRenderLoopCallback,
	WindowResizeCallback
} from "./callbacks"
import * as T from 'three'
import {CameraService} from "./camera.service"
import {FlashlightService} from "./flashlight.service"
import {RendererService} from "./renderer.service"
import {KeyboardService} from "./keyboard.service"
import {ControlsService} from "./controls.service"
import {PlayerService} from "./player.service"
import {DebugService} from "./debug.service"
import {Wad} from '../wad/parser/wad-model'
import {WorldService} from "./world.service"
import {SkyService} from "./sky.service"
import {WallService} from "./wall.service"

@Injectable({
	providedIn: 'root'
})
export class CallbackDispatcherService implements RenderCallback, InitCallback, DisposeCallback, StartRenderLoopCallback, WindowResizeCallback, BuildMapCallback {

	private readonly inits: InitCallback[] = []
	private readonly starts: StartRenderLoopCallback[] = []
	private readonly resizes: WindowResizeCallback[] = []
	private readonly renders: RenderCallback[] = []
	private readonly maps: BuildMapCallback[] = []

	constructor(private cameraService: CameraService,
							private flashlightService: FlashlightService,
							private rendererService: RendererService,
							private keyboardService: KeyboardService,
							private controlsService: ControlsService,
							private skyService: SkyService,
							private playerService: PlayerService,
							private worldService: WorldService,
							private debugService: DebugService,
							private wallService: WallService) {

		this.inits.push(
			this.keyboardService,
			this.controlsService,
			this.flashlightService,
			this.rendererService,
			this.playerService,
			this.debugService)
		this.starts.push(this.rendererService)
		this.resizes.push(this.cameraService)
		this.maps.push(this.cameraService, this.worldService, this.skyService)
		this.renders.push(this.flashlightService, this.controlsService, this.playerService, this.debugService, this.wallService)
		this.rendererService.register(this)
	}

	buildMap(wad: Wad, mapId: number, scene: T.Scene): void {
		this.maps.forEach(cb => cb.buildMap(wad, mapId, scene))
	}

	onRender(deltaMs: number, renderer: T.WebGLRenderer): void {
		this.renders.forEach(cb => cb.onRender(deltaMs, renderer))
	}

	init(canvas: HTMLCanvasElement, scene: T.Scene, camera: T.PerspectiveCamera): void {
		this.inits.forEach(cb => cb.init(canvas, scene, camera))
	}

	dispose(): void {
	}

	startRenderLoop(): void {
		this.starts.forEach(cb => cb.startRenderLoop())
	}

	onResize(width: number, height: number): void {
		this.resizes.forEach(cb => cb.onResize(width, height))
	}
}
