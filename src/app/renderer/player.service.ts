import {Injectable} from '@angular/core';
import * as T from 'three'
import {InitCallback, RenderCallback} from "./callbacks";
import {config as gc} from "../game-config";
import {WorldService} from "./world.service";
import {Either, LeftType} from "../common/either";
import {Intersection} from "three/src/core/Raycaster";

@Injectable({
	providedIn: 'root'
})
export class PlayerService implements InitCallback, RenderCallback {

	private raycaster: T.Raycaster
	private camera: T.PerspectiveCamera
	private positionGoal = 0;

	constructor(private worldService: WorldService) {
	}

	init(canvas: HTMLCanvasElement, scene: T.Scene, camera: T.PerspectiveCamera): void {
		this.raycaster = new T.Raycaster()
		this.camera = camera
	}

	findActiveFloor(): Either<Intersection> {
		const cp = this.camera.position
		this.raycaster.setFromCamera(cp, this.camera)
		this.raycaster.ray.direction.set(gc.camera.floorRay.direction.x, gc.camera.floorRay.direction.y, gc.camera.floorRay.direction.z)
		this.raycaster.ray.origin.y += gc.camera.floorRay.origin.adjust.y
		const inters = this.raycaster.intersectObjects(this.worldService.sectors.floors)
		return Either.ofCondition(() => inters.length > 0, () => "Floor not found for player position", () => inters[0], LeftType.WARN)
	}

	onRender(deltaMs: number, renderer: T.WebGLRenderer): void {
		this.findActiveFloor().exec(el =>
			this.positionGoal = Math.round((el.point.y / gc.scene.scale) + gc.player.height + gc.camera.position.adjust.y)
		)

		const camY = Math.round(this.camera.position.y);
		const mul = Math.abs(this.positionGoal - camY) > 20 ? 0.50 : 0.1 //TODO CONFIG!
		if (this.positionGoal > camY) {
			this.camera.position.y = Math.min(this.camera.position.y + Math.round(deltaMs * mul), this.positionGoal)

		} else if (this.positionGoal < camY) {
			this.camera.position.y = Math.max(this.camera.position.y - Math.round(deltaMs * mul), this.positionGoal)
		}
	}
}
