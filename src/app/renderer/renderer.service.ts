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
import {Injectable} from '@angular/core'
import * as T from "three"
import {config as GC} from "../game-config"
import {InitCallback, RenderCallback, StartRenderLoopCallback} from "./callbacks"
import {Log} from "../common/log"

const CMP = "RendererService"

@Injectable({
	providedIn: 'root'
})
export class RendererService implements InitCallback, StartRenderLoopCallback {

	private renderer: T.WebGLRenderer
	private animationCallbacks: RenderCallback[] = []
	private scene: T.Scene
	private camera: T.PerspectiveCamera

	register(...callback: RenderCallback[]): void {
		callback.forEach(e => this.animationCallbacks.push(e))
	}

	init(canvas: HTMLCanvasElement, scene: T.Scene, camera: T.PerspectiveCamera): void {
		this.scene = scene
		this.camera = camera

		const conf = GC.renderer

		this.renderer = new T.WebGLRenderer({antialias: conf.antialias, canvas})
		this.renderer.physicallyCorrectLights = conf.physicallyCorrectLights

		this.renderer.shadowMap.enabled = conf.shadowMap.enabled
		this.renderer.shadowMap.type = conf.shadowMap.type
		this.renderer.outputEncoding = conf.outputEncoding

		if (conf.resolution.width > 0) {
			this.renderer.setSize(conf.resolution.width, conf.resolution.height)
		} else {
			this.renderer.setSize(canvas.clientWidth, canvas.clientHeight)
			this.renderer.setPixelRatio(window.devicePixelRatio)
		}

		Log.info(CMP, 'WebGL2 supported:', this.renderer.capabilities.isWebGL2)
	}

	startRenderLoop(): void {
		this.renderer.setAnimationLoop(animation(this.animationCallbacks, this.renderer, this.scene, this.camera))
	}
}

const clock = new T.Clock()
const animation = (callbacks: RenderCallback[], renderer: T.WebGLRenderer, scene: T.Scene, camera: T.PerspectiveCamera) => (): void => {
	const delta = clock.getDelta()
	callbacks.forEach(cb => cb.onRender(Math.round(delta * 1000), renderer))
	renderer.render(scene, camera)
}
