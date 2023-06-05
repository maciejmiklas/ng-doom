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

import {config as gc} from '../../game-config'
import {CameraService} from "../../renderer/camera.service";
import {SkyService} from "../../renderer/sky.service";
import {FlashlightService} from "../../renderer/flashlight.service";
import {WorldService} from "../../renderer/world.service";
import {DebugService} from "../../renderer/debug.service";
import {RendererService} from "../../renderer/renderer.service";


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
	private controls: Controls
	private wad: Wad
	private map: DoomMap
	private floors: THREE.Mesh[]
	private raycaster: THREE.Raycaster
	private stats;

	constructor(private wadStorage: WadStorageService,
							private cameraService: CameraService,
							private skyService: SkyService,
							private flashlightService: FlashlightService,
							private worldService: WorldService,
							private debugService: DebugService,
							private rendererService: RendererService) {
	}

	private get canvas(): HTMLCanvasElement {
		return this.canvasRef.nativeElement
	}

	ngOnInit(): void {
		this.wad = this.wadStorage.getCurrent().get().wad
		this.rendererService.createRenderer(this.canvas)
		this.map = this.wad.maps[gc.game.startMap]
		this.scene = this.worldService.createScene()
		this.debugService.axesHelper().exec(ah => this.scene.add(ah))

		// Camera
		this.camera = this.cameraService.createPlayerCamera(this.canvas, this.scene)

		this.map.player.exec(p => this.cameraService.positionCamera(p))

		// Sky
		this.scene.add(this.skyService.createSky(this.map))

		// World
		const sectors = this.worldService.createWorld(this.map)
		this.floors = sectors.floors
		sectors.flats.forEach(fl => this.scene.add(fl))

		// controls
		this.controls = new Controls(this.camera, this.canvas)
		this.raycaster = new THREE.Raycaster()

		//this.scene.add(tb.torusAt('torus', 950, 40, 3410, 0x520D0D))
		const torusKnot1 = this.debugService.torusKnotAt('torusKnot1', 850, 40, 3410, 0X049EF4);
		this.scene.add(torusKnot1)
		const torusKnot2 = this.debugService.torusKnotAt('torusKnot2', 1100, 40, 3410, 0X049EF4);
		this.scene.add(torusKnot2)

		this.flashlightService.createFlashLight(this.scene, this.camera)

		if (gc.renderer.debug.showFps) {
			this.stats = new Stats()
			document.body.appendChild(this.stats.domElement)
			this.rendererService.register(() => this.stats.update())
		}

		this.rendererService.register((delta, renderer) => {
			this.controls.render(delta)
			this.updatePlayerPosition()
			renderer.render(this.scene, this.camera)
		})

		this.rendererService.register((delta) => {
			{
				torusKnot1.rotation.y += delta;
				torusKnot1.rotation.x += delta;
			}

			{
				torusKnot2.rotation.y += delta / 2;
				torusKnot2.rotation.x += delta / 2;
			}
		})
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


