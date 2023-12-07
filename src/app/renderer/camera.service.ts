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
import {config as gc, config as GC} from '../game-config'
import * as T from "three"
import * as THREE from "three"
import {Thing, Wad} from "../wad/parser/wad-model"
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

