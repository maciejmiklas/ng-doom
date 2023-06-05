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
import {RendererService} from "./renderer.service";

@Injectable({
	providedIn: 'root'
})
export class FlashlightService {

	private rings: T.SpotLight[] = []

	constructor(private rendererService: RendererService) {
	}

	createFlashLight(scene: T.Scene, camera: T.Camera): void {
		if (this.rings.length > 0) {
			return
		}

		const conf = GC.flashLight
		const createRingF = createRing(conf.debug.gui ? createSportLightDebug(new GUI(), scene) : emptyFunction)

		const cameraGroup = new T.Group()
		cameraGroup.rotateX(Math.PI / 2)
		camera.add(cameraGroup)

		const sceneGroup = new T.Group()
		scene.add(sceneGroup)

		conf.rings.forEach(rd => {
			const ring = createRingF(rd)
			cameraGroup.add(ring.target)
			sceneGroup.add(ring)
			this.rings.push(ring)
		})

		this.rendererService.register(() => {
			sceneGroup.position.x = camera.position.x + conf.adjust.position.x
			sceneGroup.position.y = camera.position.y + conf.adjust.position.y
			sceneGroup.position.z = camera.position.z + conf.adjust.position.z

			this.rings.forEach(ri => {
				ri.target.position.x = camera.quaternion.x + conf.adjust.target.x
				ri.target.position.y = camera.quaternion.y + conf.adjust.target.y
				ri.target.position.z = camera.quaternion.z + conf.adjust.target.z
			})
		})
	}
}

const createSportLightDebug = (gui: GUI, scene: T.Scene) => (name: string, sl): GUI => {
	const gf = gui.addFolder(name)

	gf.add(sl, 'angle', 0, 3).step(0.1)
	gf.add(sl, 'decay', 0.5, 3).step(0.1)
	gf.add(sl, 'penumbra', 0, 1).step(0.1)
	gf.add(sl, 'intensity', 0, 10000)
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

	//if (gc.flashLight[name] && gc.flashLight[name].img) {
	gf.add(sl.shadow.mapSize, 'width', 256, 2048).step(10).name('mapSize.width')
	gf.add(sl.shadow.mapSize, 'height', 256, 2048).step(10).name('mapSize.height')
	gf.add(sl.shadow.camera, 'near', 1, 1000).step(10).name('camera.near')
	gf.add(sl.shadow.camera, 'far', 1, 1000).step(10).name('camera.far')
	gf.add(sl.shadow.camera, 'focus', 0, 2).step(0.1).name('camera.focus')
//	}

	gf.open()
	return gf;
}

const createRing = (callback: (f, d) => any) =>
	({name, color, intensity, penumbra, castShadow, angle, decay, distance}: any): T.SpotLight => {

		const light = new T.SpotLight(color, intensity)
		light.penumbra = penumbra
		light.castShadow = castShadow
		light.angle = angle
		light.decay = decay
		light.distance = distance
		light.shadow.mapSize.width = 4096;
		light.shadow.mapSize.height = 4096;
		light.shadow.camera.near = 0.5; // default
		light.shadow.camera.far = 500; // default
		light.shadow.focus = 1; // default
		light.shadow.bias = -0.00001;
		/*
			if (conf.img) {
				const texture = new T.TextureLoader().load(conf.img)
				spotLight.position.set(-20, -40, 180)
				spotLight.map = texture
			}
		*/
		callback(name, light)
		return light;
	}

const emptyFunction = () => null

