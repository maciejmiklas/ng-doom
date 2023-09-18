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
import * as R from 'ramda'

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
		if (GC.flashLight.flicker.enabled) {
			this.flicker.onRender(deltaMs, renderer)
		}
	}
}

class Flicker implements RenderCallback {
	private state = FlickerState.FLICKER_START
	private timeMs = 0
	private nextTriggerMs = 0
	private lightOn = true;
	private sequences: FlickerSequence[] = []
	private sequenceIdx = 0;
	private sequenceDurationIdx = 0;

	constructor(private rings: T.SpotLight[]) {
	}

	onRender(deltaMs: number, renderer: T.WebGLRenderer): void {
		const conf = GC.flashLight.flicker
		switch (this.state) {

			case FlickerState.FLICKER_START:
				this.light(true)
				this.timeMs = 0;
				this.switchLightOn()
				this.nextTriggerMs = random(conf.triggerMs.min, conf.triggerMs.max)
				this.state = FlickerState.WAIT
				break;

			case FlickerState.WAIT:
				if (this.timeMs >= this.nextTriggerMs) {
					this.state = FlickerState.SEQUENCE_START
				}
				break;

			case FlickerState.SEQUENCE_START:
				this.state = FlickerState.SEQUENCE_ON
				this.sequences = this.createSequences()
				this.sequenceIdx = 0
				this.sequenceDurationIdx = 0
				this.timeMs = 0;
				this.flipLight()
				break;

			case FlickerState.SEQUENCE_NEXT:
				this.sequenceIdx++
				this.sequenceDurationIdx = 0
				if (this.sequenceIdx >= this.sequences.length) {
					this.state = FlickerState.FLICKER_START
				} else {
					this.state = FlickerState.SEQUENCE_ON
				}
				break;

			case FlickerState.SEQUENCE_ON: {
				const sequence = this.sequences[this.sequenceIdx];
				if (R.isNil(sequence)) {//TODO - I've not NPE here: sequence nil at: 0 0 0
					console.log('sequence nil at:', this.sequenceIdx, this.sequenceDurationIdx, this.sequences.length)
				}
				if (this.timeMs > sequence.duration[this.sequenceDurationIdx]) {
					this.timeMs = 0;
					this.flipLight()
					this.sequenceDurationIdx++;
					if (this.sequenceDurationIdx >= sequence.duration.length) {
						this.state = FlickerState.SEQUENCE_NEXT
					}
				}
			}
				break;
		}
		this.timeMs += deltaMs
	}

	private createSequences(): FlickerSequence[] {
		const actions: FlickerSequence[] = []
		GC.flashLight.flicker.sequence.forEach(ac => {
			const repeat = random(ac.repeat.min, ac.repeat.max)
			if (repeat > 0) {
				actions.push({
					duration: R.unfold((n) => n == repeat ?
						false :
						[random(ac.durationMs.min, ac.durationMs.max), n + 1], 0)
				})
			}
		})
		return actions;
	}

	private flipLight(): void {
		this.lightOn = !this.lightOn
		this.light(this.lightOn)
	}

	private switchLightOn(): void {
		this.lightOn = true
		this.light(true)
	}

	private light(on: boolean): void {
		this.rings.forEach(sl => {
			sl.visible = on;
		})
	}

}

type FlickerSequence = {
	duration: number[]
}


enum FlickerState {
	FLICKER_START,
	WAIT,
	SEQUENCE_START,
	SEQUENCE_ON,
	SEQUENCE_NEXT
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

