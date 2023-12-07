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
