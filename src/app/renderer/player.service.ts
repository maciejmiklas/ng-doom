import {Injectable} from '@angular/core';
import * as T from 'three'
import {InitCallback, RenderCallback} from "./callbacks";
import {config as GC} from "../game-config";
import {WorldService} from "./world.service";
import {Either, LeftType} from "../common/either";
import {Intersection} from "three/src/core/Raycaster";
import {Log} from "../common/log";

const CMP = "PlayerService"

@Injectable({
	providedIn: 'root'
})
export class PlayerService implements InitCallback, RenderCallback {

	private raycaster: T.Raycaster
	private camera: T.PerspectiveCamera
	private positionGoal = 0;
	private lastFloorName = "-"

	constructor(private worldService: WorldService) {
	}

	init(canvas: HTMLCanvasElement, scene: T.Scene, camera: T.PerspectiveCamera): void {
		this.raycaster = new T.Raycaster()
		this.camera = camera
	}

	findActiveFloor(): Either<Intersection> {
		this.raycaster.setFromCamera(this.camera.position, this.camera)
		const flr = GC.player.floorRay
		this.raycaster.ray.direction.set(flr.direction.x, flr.direction.y, flr.direction.z)
		this.raycaster.ray.origin.y += flr.origin.adjust.y
		const inters = this.raycaster.intersectObjects(this.worldService.floors)
		return Either.ofCondition(() => inters.length > 0,
			() => 'Floor not found for player position',
			() => inters[0], LeftType.WARN)
	}

	private logSector(el: Intersection) {
		if (Log.isInfo() && GC.player.debug.logSectorName) {
			const florName = el.object.name;
			if (this.lastFloorName !== florName) {
				Log.info(CMP, 'Entering: ', el.object.name)
				this.lastFloorName = florName
			}
		}
	}

	onRender(deltaMs: number, renderer: T.WebGLRenderer): void {
		this.findActiveFloor().exec(el => {
				this.logSector(el)
				return this.positionGoal = Math.round((el.point.y / GC.scene.scale) + GC.player.height + GC.camera.position.adjust.y)
			}
		)
		const camY = Math.round(this.camera.position.y);
		const dc = GC.player.damping
		const mul = Math.abs(this.positionGoal - camY) > dc.fallHeight ? dc.fallSpeed : dc.climbSpeed
		if (this.positionGoal > camY) {
			this.camera.position.y = Math.min(this.camera.position.y + Math.round(deltaMs * mul), this.positionGoal)

		} else if (this.positionGoal < camY) {
			this.camera.position.y = Math.max(this.camera.position.y - Math.round(deltaMs * mul), this.positionGoal)
		}
	}
}
