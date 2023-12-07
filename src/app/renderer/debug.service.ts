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
import {Either} from "../common/either"
import * as T from "three"
import {config as gc, config as GC} from "../game-config"
import {InitCallback, RenderCallback} from "./callbacks"
import * as Stats from 'stats.js'

@Injectable({
	providedIn: 'root'
})
export class DebugService implements InitCallback, RenderCallback {
	private torusKnot1
	private torusKnot2
	private stats: Stats

	init(canvas: HTMLCanvasElement, scene: T.Scene, camera: T.PerspectiveCamera): void {
		this.axesHelper().exec(ah => scene.add(ah))

		this.torusKnot1 = this.torusKnotAt('torusKnot1', 850, 40, 3410, 0X049EF4)
		scene.add(this.torusKnot1)

		this.torusKnot2 = this.torusKnotAt('torusKnot2', 1100, 40, 3410, 0X049EF4)
		scene.add(this.torusKnot2)

		if (gc.renderer.debug.showFps) {
			this.stats = new Stats()
			document.body.appendChild(this.stats.domElement)
		}
	}

	onRender(deltaMs: number, renderer: T.WebGLRenderer): void {
		if (this.stats) {
			this.stats.update()
		}
		{
			this.torusKnot1.rotation.y += deltaMs / 1000
			this.torusKnot1.rotation.x += deltaMs / 1000
		}

		{
			this.torusKnot2.rotation.y += deltaMs / 2000
			this.torusKnot2.rotation.x += deltaMs / 2000
		}
	}

	axesHelper(): Either<T.AxesHelper> {
		const ah = GC.scene.debug.axesHelper
		return Either.ofCondition(() => ah.visible, () => 'Axes helper disabled',
			() => new T.AxesHelper(500).setColors(new T.Color(ah.colors.x), new T.Color(ah.colors.y), new T.Color(ah.colors.z)))
	}

	point(x: number, y: number, z: number, color: T.ColorRepresentation = 0xff0000): T.Object3D {
		const dotGeometry = new T.BufferGeometry()
		dotGeometry.setAttribute('position', new T.BufferAttribute(new Float32Array([x, y, z]), 3))
		const dotMaterial = new T.PointsMaterial({size: 5, color})
		return new T.Points(dotGeometry, dotMaterial)
	}

	boxAt(x: number, y: number, z: number, dim = 5, color = 0x00ff00): T.Object3D {
		const geometry = new T.BoxGeometry(dim, dim, dim)
		const segments = new T.LineSegments(new T.EdgesGeometry(geometry), new T.LineBasicMaterial({color}))
		segments.position.set(x, y, z)
		return segments
	}

	torusAt(name: string, x: number, y: number, z: number, color = 0x00ff00, radius = 20, tube = 5): T.Object3D {
		const mesh = new T.Mesh(
			new T.TorusGeometry(radius, tube, 32, 32),
			new T.MeshPhongMaterial({wireframe: false, color})
		)
		mesh.position.set(x, y, z)
		mesh.name = name
		mesh.castShadow = true
		return mesh
	}

	torusKnotAt(name: string, x: number, y: number, z: number, color = 0x049ef4, radius = 20, tube = 5): T.Object3D {
		const mesh = new T.Mesh(
			new T.TorusKnotGeometry(radius, tube, 200, 32),
			new T.MeshStandardMaterial({color, roughness: 0, metalness: 0.5})
		)
		mesh.position.set(x, y, z)
		mesh.name = name
		mesh.castShadow = true
		return mesh
	}


}
