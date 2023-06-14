import {Injectable} from '@angular/core';
import {
	BuildMapCallback,
	DisposeCallback,
	InitCallback,
	RenderCallback,
	StartRenderLoopCallback,
	WindowResizeCallback
} from "./callbacks";
import * as T from 'three'
import {CameraService} from "./camera.service";
import {FlashlightService} from "./flashlight.service";
import {RendererService} from "./renderer.service";
import {KeyboardService} from "./keyboard.service";
import {ControlsService} from "./controls.service";
import {PlayerService} from "./player.service";
import {DebugService} from "./debug.service";
import {DoomMap, Wad} from '../wad/parser/wad-model';
import {WorldService} from "./world.service";

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
							private playerService: PlayerService,
							private worldService: WorldService,
							private debugService: DebugService) {

		this.inits.push(
			this.keyboardService,
			this.controlsService,
			this.flashlightService,
			this.rendererService,
			this.playerService,
			this.debugService)
		this.starts.push(this.rendererService)
		this.resizes.push(this.cameraService)
		this.maps.push(this.cameraService, this.worldService)
		this.renders.push(this.flashlightService, this.controlsService, this.playerService, this.debugService)
		this.rendererService.register(this)
	}

	buildMap(wad: Wad, map: DoomMap, scene: T.Scene): void {
		this.maps.forEach(cb => cb.buildMap(wad, map, scene))
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
