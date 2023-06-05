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
import * as T from "three";
import * as THREE from "three";
import {config as GC} from "../game-config";

@Injectable({
	providedIn: 'root'
})
export class RendererService {

	private renderer: T.WebGLRenderer
	private animationCallbacks: RenderCallback[] = []

	createRenderer(canvas: HTMLCanvasElement): T.WebGLRenderer {
		if (this.renderer != undefined) {
			return this.renderer
		}
		const conf = GC.renderer

		this.renderer = new T.WebGLRenderer({antialias: conf.antialias, canvas})
		this.renderer.physicallyCorrectLights = conf.physicallyCorrectLights

		// a beam from the flashlight does not dazzle when getting close to the wall
		//renderer.toneMapping = T.CineonToneMapping
		//renderer.toneMapping = T.ACESFilmicToneMapping;

		this.renderer.shadowMap.enabled = conf.shadowMap.enabled
		this.renderer.shadowMap.type = conf.shadowMap.type
		this.renderer.outputEncoding = conf.outputEncoding
		//renderer.toneMappingExposure = 1;

		if (conf.resolution.width > 0) {
			this.renderer.setSize(conf.resolution.width, conf.resolution.height)
		} else {
			this.renderer.setSize(canvas.clientWidth, canvas.clientHeight)
			this.renderer.setPixelRatio(window.devicePixelRatio)
		}
		this.renderer.setAnimationLoop(animation(this.animationCallbacks, this.renderer))
		return this.renderer
	}

	register(callback: RenderCallback): void {
		this.animationCallbacks.push(callback)
	}
}

const CLOCK = new THREE.Clock();

const animation = (callbacks: RenderCallback[], renderer: T.WebGLRenderer) => (): void => {
	const delta = CLOCK.getDelta();
	callbacks.forEach(cb => cb(delta, renderer))
}

export type RenderCallback = (delta: number, renderer: T.WebGLRenderer) => void
