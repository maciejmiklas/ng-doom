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
import {Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core'
import * as THREE from 'three'
import * as Stats from 'stats.js'
import {Controls} from '../controls'
import {WadStorageService} from '../../wad/wad-storage.service'
import {DoomMap, Wad} from '../../wad/parser/wad-model'

import {functions as tb} from '../../renderer/three-builder'
import {config as gc} from '../../game-config'



/* TODO:
// Funktion als param!!!
type XRFrameRequestCallback = (time: DOMHighResTimeStamp, frame: XRFrame) => void;
  setAnimationLoop(callback: XRFrameRequestCallback | null): void;

##################################################################################################################

dumping, that is does not stop immedately

https://discoverthreejs.com/book/first-steps/camera-controls/#smoothly-transition-to-a-new-camera-position


OrbitControls.js:
if ( scope.enableDamping ) {

		spherical.theta += sphericalDelta.theta * scope.dampingFactor;
		spherical.phi += sphericalDelta.phi * scope.dampingFactor;

	} else {

		spherical.theta += sphericalDelta.theta;
		spherical.phi += sphericalDelta.phi;

	}

https://discoverthreejs.com/book/first-steps/camera-controls/
  controls.enableDamping = true;

##################################################################################################################
 light from the DirectionalLight shines from light.position to light.target.position

 ##################################################################################################################

 */
@Component({
    selector: 'app-play',
    templateUrl: './play.component.html',
    styleUrls: ['./play.component.css'],
    standalone: true
})
export class PlayComponent implements OnInit {

	@ViewChild('canvas', {static: true})
	private canvasRef: ElementRef<HTMLCanvasElement>
	private camera: THREE.PerspectiveCamera
	private scene: THREE.Scene
	private renderer: THREE.WebGLRenderer
	private controls: Controls
	private wad: Wad
	private map: DoomMap
	private floors: THREE.Mesh[]
	private raycaster: THREE.Raycaster
	private flashLight: THREE.Object3D
	private stats;

	constructor(private wadStorage: WadStorageService) {
	}

	private get canvas(): HTMLCanvasElement {
		return this.canvasRef.nativeElement
	}

	ngOnInit(): void {
		this.wad = this.wadStorage.getCurrent().get().wad
		this.renderer = tb.createRenderer(this.canvas)
		this.map = this.wad.maps[gc.game.startMap]
		this.scene = tb.createScene()

		// Camera
		this.camera = tb.createCamera(this.canvas)
		this.scene.add(this.camera)
		tb.positionCamera(this.camera, this.map)
		this.camera.lookAt(this.scene.position)

		if (gc.camera.debug.crossHelper) {
			this.scene.add(new THREE.CameraHelper(this.camera))
		}

		// Sky
		this.scene.add(tb.createSky(this.map))

		// World
		const sectors = tb.createWorld(this.map)
		this.floors = sectors.floors
		sectors.flats.forEach(fl => this.scene.add(fl))

		// controls
		this.controls = new Controls(this.camera, this.canvas)
		this.raycaster = new THREE.Raycaster()

		//this.scene.add(tb.torusAt('torus', 950, 40, 3410, 0x520D0D))
		this.scene.add(tb.torusKnotAt('torusKnot', 850, 40, 3410, 0X049EF4))

		this.flashLight = tb.createFlashLight(this.scene, this.camera)

		this.renderer.setAnimationLoop(animation(this))

		if (gc.renderer.debug.showFps) {
			this.stats = new Stats()
			document.body.appendChild(this.stats.domElement)
		}
	}

	@HostListener('window:resize')
	onResize() {
		this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
		this.camera.updateProjectionMatrix()
	}

	private updatePlayerPosition(): void {
		const cp = this.camera.position
		this.raycaster.setFromCamera(cp, this.camera)
		this.raycaster.ray.direction.set(gc.camera.florRay.direction.x, gc.camera.florRay.direction.y, gc.camera.florRay.direction.z)
		this.raycaster.ray.origin.y += gc.camera.florRay.origin.adjust.y
		const inters = this.raycaster.intersectObjects(this.floors)
		if (inters.length > 0) {
			cp.y = (inters[0].point.y / gc.scene.scale) + gc.player.height + gc.camera.position.adjust.y
		}
	}
}

const clock = new THREE.Clock();

const animation = (comp) => (time: number) => {
	const delta = clock.getDelta();
	if (gc.renderer.debug.showFps) {
		comp.stats.update()
	}
	comp.controls.render(delta)
	comp.updatePlayerPosition()
	comp.renderer.render(comp.scene, comp.camera)

	const torusKnot = comp.scene.getObjectByName('torusKnot');
	torusKnot.rotation.y = time / 1000;
	torusKnot.rotation.x = time / 1000;

	//const torus = comp.scene.getObjectByName('torus');
	//torus.rotation.y = time / 1000;
//	torus.rotation.x = time / 1000;

}

