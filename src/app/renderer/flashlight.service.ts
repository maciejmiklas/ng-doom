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

@Injectable({
	providedIn: 'root'
})
export class FlashlightService {

	createFlashLight(scene: T.Scene, camera: T.Camera): T.Object3D {

		{
			const spotLight = new T.SpotLight(0xff8888);
			spotLight.angle = Math.PI / 5;
			spotLight.penumbra = 0.3;
			spotLight.decay = 1.2;
			spotLight.intensity = 5000;
			spotLight.position.set(850, 40, 3470);
			spotLight.target.position.set(852, 40, 3465);
			spotLight.castShadow = true;
			scene.add(spotLight);
			scene.add(new T.SpotLightHelper(spotLight))

			const gui = new GUI()
			createSportLightDebug(gui, scene)('SL', spotLight)
		}

		const group = new T.Group()
		group.rotateX(Math.PI / 2)

		const createRingF = createRing(GC.flashLight.debug.gui ? createSportLightDebug(new GUI(), scene) : emptyFunction)

		const ambient = createRingF('ambient')
		group.add(ambient)
		group.add(ambient.target)

		//group.add(createRingF('img'))
		const ring1 = createRingF('ring1')
		group.add(ring1)
		group.add(ring1.target)

		const ring2 = createRingF('ring2')
		group.add(ring2)
		group.add(ring2.target)

		const ring3 = createRingF('ring3')
		group.add(ring3)
		group.add(ring3.target)

		camera.add(group);
		//camera.add(group.target)

		//const rg1 = createRingF('ring1')
		//rg1.intensity = 5000

//	rg1.position.set(850, 40, 3470);
//	rg1.target.position.set(852, 40, 3465);
		//scene.add(new T.SpotLightHelper(rg1))
		//scene.add(rg1)
		//group.add(rg1)
		//camera.add(rg1.target);


		//createRingF('ring2')
		//createRingF('ring3')

		//camera.add(flashLight)

//	camera.add(group)
		return group;
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

//	gf.open()
	return gf;
}

const createRing = (callback: (f, d) => any) => (name: string): T.SpotLight => {
	const conf = GC.flashLight[name];
	const spotLight = new T.SpotLight(conf.color, conf.intensity)

	//spotLight.rotateZ(Math.PI / 2)

	spotLight.penumbra = conf.penumbra
	spotLight.castShadow = conf.castShadow
	spotLight.angle = conf.angle
	spotLight.decay = conf.decay

	if (conf.img) {
		const texture = new T.TextureLoader().load(conf.img)
		//texture.minFilter = T.LinearFilter
		//	texture.magFilter = T.LinearFilter
		//	texture.encoding = T.sRGBEncoding
		spotLight.position.set(-20, -40, 180)
		spotLight.map = texture
		//	spotLight.shadow.mapSize.width = 1024;
		////	spotLight.shadow.mapSize.height = 1024;
		//	spotLight.shadow.camera.near = 200;
		//	spotLight.shadow.camera.far = 2000;
		//	spotLight.shadow.focus = 0.1;
	}

	callback(name, spotLight)
	return spotLight;
}

const emptyFunction = () => null

