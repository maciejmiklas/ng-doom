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
import {Injectable} from '@angular/core'
import {config as gc, config as GC} from '../game-config'
import * as T from "three"
import * as THREE from "three"
import {DoomMap, Thing, Wad} from "../wad/parser/wad-model"
import {BuildMapCallback, WindowResizeCallback} from "./callbacks"

@Injectable({
	providedIn: 'root'
})
export class CameraService implements WindowResizeCallback, BuildMapCallback {

	private camera: T.PerspectiveCamera

	create({clientWidth, clientHeight}: HTMLCanvasElement, scene: THREE.Scene): T.PerspectiveCamera {
		if (this.camera != null) {
			return this.camera
		}
		this.camera = new T.PerspectiveCamera(
			GC.camera.perspective.fov,
			clientWidth / clientHeight,
			GC.camera.perspective.near,
			GC.camera.perspective.far)

		this.camera.lookAt(scene.position)
		scene.add(this.camera)

		if (gc.camera.debug.cameraHelper) {
			scene.add(new THREE.CameraHelper(this.camera))
		}
		return this.camera
	}

	private positionCamera(player: Thing): void {
		this.camera.position.set(player.position.x, GC.player.height, -player.position.y)
	}

	onResize(width: number, height: number): void {
		this.camera.aspect = width / height
		this.camera.updateProjectionMatrix()
	}

	buildMap(wad: Wad, mapId: number, scene: T.Scene): void {
		wad.maps[mapId].player.exec(p => this.positionCamera(p))
	}

}

