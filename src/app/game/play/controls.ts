import {PointerLockControls} from 'three/examples/jsm/controls/PointerLockControls';
import * as THREE from 'three';

export class Controls {

	private prevTime = performance.now();
	private moveX = MoveX.NO;
	private moveY = MoveY.NO;
	private readonly controls: PointerLockControls;
	private camera: THREE.PerspectiveCamera;
	moveSlow = 5;

	constructor(camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement) {
		window.addEventListener('keydown', this.onKeyDown.bind(this));
		window.addEventListener('keyup', this.onKeyUp.bind(this));
		canvas.addEventListener('click', this.onClick.bind(this));
		this.camera = camera;
		this.controls = new PointerLockControls(camera, canvas);
	}

	onRender(): void {
		const time = performance.now();
		const mf = (time - this.prevTime) / this.moveSlow;

		if (this.moveY === MoveY.FORWARD) {
			this.controls.moveForward(mf);
		} else if (this.moveY === MoveY.BACKWARD) {
			this.controls.moveForward(-mf);
		}

		if (this.moveX === MoveX.LEFT) {
			this.controls.moveRight(-mf);
		} else if (this.moveX === MoveX.RIGHT) {
			this.controls.moveRight(mf);
		}
		this.prevTime = time;
		//console.log('>', this.camera.position)
	}

	private onClick() {
		if (this.controls.isLocked) {
			this.controls.unlock();
		} else {
			this.controls.lock();
		}
	}

	private onKeyDown(event) {
		switch (event.code) {
			case 'ArrowUp':
			case 'KeyW':
				this.moveY = MoveY.FORWARD;
				break;

			case 'ArrowDown':
			case 'KeyS':
				this.moveY = MoveY.BACKWARD;
				break;

			case 'ArrowLeft':
			case 'KeyA':
				this.moveX = MoveX.LEFT;
				break;

			case 'ArrowRight':
			case 'KeyD':
				this.moveX = MoveX.RIGHT;
				break;
		}
	};

	private onKeyUp(event) {
		switch (event.code) {
			case 'ArrowDown':
			case 'KeyS':
			case 'ArrowUp':
			case 'KeyW':
				this.moveY = MoveY.NO;
				break;

			case 'ArrowRight':
			case 'KeyD':
			case 'ArrowLeft':
			case 'KeyA':
				this.moveX = MoveX.NO;
				break;
		}
	};
}

enum MoveY {
	FORWARD, BACKWARD, NO
}

enum MoveX {
	LEFT, RIGHT, NO
}
