import {Injectable} from '@angular/core';
import * as T from 'three'
import {InitCallback, RenderCallback} from "./callbacks";
import {config as gc} from "../game-config";
import {WorldService} from "./world.service";

@Injectable({
	providedIn: 'root'
})
export class PlayerService implements InitCallback, RenderCallback {

	private raycaster: T.Raycaster
	private camera: T.PerspectiveCamera

	constructor(private worldService: WorldService) {
	}

	init(canvas: HTMLCanvasElement, scene: T.Scene, camera: T.PerspectiveCamera): void {
		this.raycaster = new T.Raycaster()
		this.camera = camera
	}

	onRender(deltaMs: number, renderer: T.WebGLRenderer): void {
		const cp = this.camera.position
		this.raycaster.setFromCamera(cp, this.camera)
		this.raycaster.ray.direction.set(gc.camera.florRay.direction.x, gc.camera.florRay.direction.y, gc.camera.florRay.direction.z)
		this.raycaster.ray.origin.y += gc.camera.florRay.origin.adjust.y
		const inters = this.raycaster.intersectObjects(this.worldService.sectors.floors)
		if (inters.length > 0) {
			cp.y = (inters[0].point.y / gc.scene.scale) + gc.player.height + gc.camera.position.adjust.y
		}
	}
}
