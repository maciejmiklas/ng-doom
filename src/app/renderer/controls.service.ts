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
import {PointerLockControls} from "three/examples/jsm/controls/PointerLockControls"
import * as T from "three"
import {InitCallback, RenderCallback} from "./callbacks"
import {config as GC} from '../game-config'

@Injectable({
	providedIn: 'root'
})
export class ControlsService implements InitCallback, RenderCallback {

	private moveX = MoveX.NO
	private moveY = MoveY.NO
	private controls: PointerLockControls

	init(canvas: HTMLCanvasElement, scene: T.Scene, camera: T.PerspectiveCamera): void {
		window.addEventListener('keydown', this.onKeyDown.bind(this))
		window.addEventListener('keyup', this.onKeyUp.bind(this))
		canvas.addEventListener('click', this.onClick.bind(this))
		this.controls = new PointerLockControls(camera, canvas)
	}

	private onClick(): void {
		if (this.controls.isLocked) {
			this.controls.unlock()
		} else {
			this.controls.lock()
		}
	}

	// TODO move keys to keyboard.service
	private onKeyDown(event): void {
		switch (event.code) {
			case 'ArrowUp':
			case 'KeyW':
				this.moveY = MoveY.FORWARD
				break

			case 'ArrowDown':
			case 'KeyS':
				this.moveY = MoveY.BACKWARD
				break

			case 'ArrowLeft':
			case 'KeyA':
				this.moveX = MoveX.LEFT
				break

			case 'ArrowRight':
			case 'KeyD':
				this.moveX = MoveX.RIGHT
				break
		}
	}

	private onKeyUp(event): void {
		switch (event.code) {
			case 'ArrowDown':
			case 'KeyS':
			case 'ArrowUp':
			case 'KeyW':
				this.moveY = MoveY.NO
				break

			case 'ArrowRight':
			case 'KeyD':
			case 'ArrowLeft':
			case 'KeyA':
				this.moveX = MoveX.NO
				break
		}
	}

	onRender(deltaMs: number, renderer: T.WebGLRenderer): void {
		const mf = deltaMs * GC.move.distancePerSec
		if (this.moveY === MoveY.FORWARD) {
			this.controls.moveForward(mf)

		} else if (this.moveY === MoveY.BACKWARD) {
			this.controls.moveForward(-mf)
		}

		if (this.moveX === MoveX.LEFT) {
			this.controls.moveRight(-mf)

		} else if (this.moveX === MoveX.RIGHT) {
			this.controls.moveRight(mf)
		}
		//console.log('>CAM>', this.camera.position)
	}
}

enum MoveY {
	FORWARD, BACKWARD, NO
}

enum MoveX {
	LEFT, RIGHT, NO
}
