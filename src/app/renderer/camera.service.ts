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
import {Injectable} from '@angular/core';
import {config as gc, config as GC} from '../game-config'
import * as T from "three"
import * as THREE from "three"
import {Thing} from "../wad/parser/wad-model"

@Injectable({
	providedIn: 'root'
})
export class CameraService {

	private playerCamera: T.PerspectiveCamera

	createPlayerCamera({clientWidth, clientHeight}: HTMLCanvasElement, scene: THREE.Scene): T.PerspectiveCamera {
		if (this.playerCamera != null) {
			return this.playerCamera;
		}
		this.playerCamera = new T.PerspectiveCamera(
			GC.camera.perspective.fov,
			clientWidth / clientHeight,
			GC.camera.perspective.near,
			GC.camera.perspective.far)

		this.playerCamera.lookAt(scene.position)
		scene.add(this.playerCamera)

		if (gc.camera.debug.cameraHelper) {
			scene.add(new THREE.CameraHelper(this.playerCamera))
		}

		return this.playerCamera;
	}

	positionCamera(player: Thing): void {
		this.playerCamera.position.set(player.position.x, GC.player.height, -player.position.y)
	}

}

