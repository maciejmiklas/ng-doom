import {Injectable} from '@angular/core';
import {FlashlightService} from "./flashlight.service";
import {InitCallback} from "./callbacks";
import * as T from "three";

@Injectable({
	providedIn: 'root'
})
export class KeyboardService implements InitCallback {

	constructor(private flashlightService: FlashlightService) {
	}

	private onKeyDown(event) {
		switch (event.code) {
			case 'KeyF':
				this.flashlightService.toggle()
				break
		}
	}

	init(canvas: HTMLCanvasElement, scene: T.Scene, camera: T.PerspectiveCamera): void {
		window.addEventListener('keydown', this.onKeyDown.bind(this))
	}

}
