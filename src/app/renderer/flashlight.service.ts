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
import {GUI} from "dat.gui";
import * as T from "three";
import {config as GC} from "../game-config";
import {InitCallback, RenderCallback} from "./callbacks";

@Injectable({
	providedIn: 'root'
})
export class FlashlightService implements InitCallback, RenderCallback {

	private rings: T.SpotLight[] = []
	private lightOn = false;
	private camera: T.PerspectiveCamera;
	private sceneGroup: T.Group
	private flicker: Flicker;

	init(canvas: HTMLCanvasElement, scene: T.Scene, camera: T.PerspectiveCamera): void {
		if (this.initialized()) {
			return
		}
		this.camera = camera

		const conf = GC.flashLight
		const gui = conf.debug.gui ? new GUI() : null
		if (gui) {
			createAdjustDebug(gui)
		}

		const createRingF = createRing(gui ? createSpotLightDebug(new GUI(), scene) : emptyFunction)

		const cameraGroup = new T.Group()
		cameraGroup.rotateX(Math.PI / 2)
		camera.add(cameraGroup)

		this.sceneGroup = new T.Group()
		scene.add(this.sceneGroup)

		conf.rings.forEach(rd => {
			const ring = createRingF(rd)
			cameraGroup.add(ring.target)
			this.sceneGroup.add(ring)
			this.rings.push(ring)
		})

		this.flicker = new Flicker(this.rings)
		this.propagateVisibility()
	}

	on(): void {
		if (!this.initialized()) {
			return;
		}
		this.lightOn = true;
		this.propagateVisibility()
	}

	off(): void {
		if (!this.initialized()) {
			return;
		}
		this.lightOn = false;
		this.propagateVisibility()
	}

	toggle(): void {
		if (this.lightOn) {
			this.off()
		} else {
			this.on()
		}
	}

	private propagateVisibility(): void {
		this.rings.forEach(sl => {
			sl.visible = this.lightOn;
		})
	}

	private initialized(): boolean {
		return this.rings.length > 0
	}

	onRender(deltaMs: number, renderer: T.WebGLRenderer): void {
		if (!this.lightOn) {
			return;
		}
		const conf = GC.flashLight
		this.sceneGroup.position.x = this.camera.position.x + conf.adjust.position.x
		this.sceneGroup.position.y = this.camera.position.y + conf.adjust.position.y
		this.sceneGroup.position.z = this.camera.position.z + conf.adjust.position.z

		this.rings.forEach(sl => {
			sl.target.position.x = this.camera.quaternion.x + conf.adjust.target.x
			sl.target.position.y = this.camera.quaternion.y + conf.adjust.target.y
			sl.target.position.z = this.camera.quaternion.z + conf.adjust.target.z
		})
		this.flicker.onRender(deltaMs, renderer)
	}
}

class Flicker implements RenderCallback {
	private state = FlickerState.STARTING
	private timeMs = 0
	private nextTriggerMs = 0
	private repeatMax = 0
	private repeatCur = 0
	private sequenceDurationMs = 0
	private lightOn = true;

	constructor(private rings: T.SpotLight[]) {
	}

	onRender(deltaMs: number, renderer: T.WebGLRenderer): void {
		const conf = GC.flashLight.flicker
		switch (this.state) {

			case FlickerState.STARTING:
				this.timeMs = 0;
				this.lightOn = true
				this.nextTriggerMs = random(conf.triggerEveryMs.min, conf.triggerEveryMs.max)
				this.state = FlickerState.WAITING
				break;

			case FlickerState.WAITING:
				if (this.timeMs >= this.nextTriggerMs) {
					this.state = FlickerState.SEQUENCE_START
				}
				break;

			case FlickerState.SEQUENCE_START:
				this.repeatCur = 0
				this.repeatMax = random(conf.sequence.repeat.min, conf.sequence.repeat.max)
				this.state = FlickerState.SEQUENCE_ON
				this.restartSequence()
				this.flipLight()
				break;

			case FlickerState.SEQUENCE_ON:
				if (this.timeMs > this.sequenceDurationMs) {
					this.flipLight()
					this.restartSequence()
					this.repeatCur++
				}
				if (this.repeatCur > this.repeatMax) {
					this.light(true)
					this.state = FlickerState.STARTING
				}
				break;
		}
		this.timeMs += deltaMs
	}

	private restartSequence() {
		this.timeMs = 0
		this.sequenceDurationMs = random(GC.flashLight.flicker.sequence.durationMs.min, GC.flashLight.flicker.sequence.durationMs.max)
	}

	private flipLight():void{
		this.lightOn = !this.lightOn
		this.light(this.lightOn)
	}
	private light(on: boolean): void {
		this.rings.forEach(sl => {
			sl.visible = on;
		})
	}

}

enum FlickerState {
	STARTING,
	WAITING,
	SEQUENCE_START,
	SEQUENCE_ON
}

const createAdjustDebug = (gui: GUI): void => {
	const max = 200;
	{
		const ad = gui.addFolder("Adjust Position")
		const position = GC.flashLight.adjust.position;
		ad.add(position, 'x', -max, max).step(1)
		ad.add(position, 'y', -max, max).step(1)
		ad.add(position, 'z', -max, max).step(1)
	}

	{
		const ad = gui.addFolder("Adjust Target")
		const position = GC.flashLight.adjust.target;
		ad.add(position, 'x', -max, max).step(1)
		ad.add(position, 'y', -max, max).step(1)
		ad.add(position, 'z', -max, max).step(1)
	}
}

const createSpotLightDebug = (gui: GUI, scene: T.Scene) => (name: string, sl): void => {
	const gf = gui.addFolder(name)
	gf.add(sl, 'angle', 0, 3).step(0.1)
	gf.add(sl, 'decay', 0.5, 3).step(0.1)
	gf.add(sl, 'penumbra', 0, 1).step(0.1)
	gf.add(sl, 'intensity', 0, 10000)
	gf.add(sl, 'power', 0, 10000)
	gf.add(sl, 'distance', 0, 10000)
	gf.add(sl.position, 'x', -10000, 10000)
	gf.add(sl.position, 'y', -10000, 10000)
	gf.add(sl.position, 'z', -10000, 10000)
	gf.add(sl, 'castShadow')

	gf.add({
		cross: () => {
			scene.add(new T.SpotLightHelper(sl))
		}
	}, 'cross').name('SpotLightHelper');
}

const createRing = (callback: (f, d) => any) =>
	({name, color, intensity, penumbra, castShadow, angle, decay, distance, img}: any): T.SpotLight => {

		const conf = GC.flashLight.spotLight;
		const light = new T.SpotLight(color, intensity)
		light.penumbra = penumbra
		light.castShadow = castShadow
		light.angle = angle
		light.decay = decay
		light.distance = distance
		light.shadow.mapSize.width = conf.shadow.mapSize
		light.shadow.mapSize.height = conf.shadow.mapSize
		light.shadow.bias = conf.shadow.bias
		if (img) {
			light.map = new T.TextureLoader().load(img)
		}

		callback(name, light)
		return light;
	}

const emptyFunction = () => null

const random = (min, max) => Math.floor(Math.random() * (max - min)) + min;

