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
import {PointerLockControls} from 'three/examples/jsm/controls/PointerLockControls'
import * as THREE from 'three'
import {config as gc} from './game-config'

export class Controls {

	private prevTime = performance.now()
	private moveX = MoveX.NO
	private moveY = MoveY.NO
	private readonly controls: PointerLockControls
	private camera: THREE.PerspectiveCamera

	constructor(camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement) {
		window.addEventListener('keydown', this.onKeyDown.bind(this))
		window.addEventListener('keyup', this.onKeyUp.bind(this))
		canvas.addEventListener('click', this.onClick.bind(this))
		this.camera = camera
		this.controls = new PointerLockControls(camera, canvas)
	}

	render(): void {
		const time = performance.now()
		const mf = (time - this.prevTime) / gc.move.slow

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
		this.prevTime = time
		//console.log('>', this.camera.position)
	}

	private onClick() {
		if (this.controls.isLocked) {
			this.controls.unlock()
		} else {
			this.controls.lock()
		}
	}

	private onKeyDown(event) {
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

	private onKeyUp(event) {
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
}

enum MoveY {
	FORWARD, BACKWARD, NO
}

enum MoveX {
	LEFT, RIGHT, NO
}
