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
import {Controls} from '../controls'
import {WadStorageService} from '../../wad/wad-storage.service'
import {DoomMap, Wad} from '../../wad/parser/wad-model'

import {functions as tb} from '../three-builder'
import {config as gc} from '../../game-config'

@Component({
	selector: 'app-play',
	templateUrl: './play.component.html',
	styleUrls: ['./play.component.css']
})
export class PlayComponent implements OnInit {

	@ViewChild('canvas', {static: true})
	private canvasRef: ElementRef<HTMLCanvasElement>
	private camera: THREE.PerspectiveCamera
	private scene: THREE.Scene
	private webGLRenderer: THREE.WebGLRenderer
	private controls: Controls
	private wad: Wad
	private map: DoomMap
	private floors: THREE.Mesh[]
	private raycaster: THREE.Raycaster

	constructor(private wadStorage: WadStorageService) {
	}

	private get canvas(): HTMLCanvasElement {
		return this.canvasRef.nativeElement
	}

	ngOnInit(): void {
		this.wad = this.wadStorage.getCurrent().get().wad
		this.webGLRenderer = tb.createWebGlRenderer(this.canvas)
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

		{
			const light = new THREE.PointLight(0xFFFF00, 200.0, 4000, 1.1)
			//light.castShadow = true
			light.add(new THREE.Mesh(new THREE.SphereGeometry(2, 32, 32),
				new THREE.MeshBasicMaterial({color: 0xFFFF00})));
			light.position.set(950, 40, 3390);
			//	this.scene.add(light)

			this.scene.add(tb.torusAt(950, 40, 3410, 0x520D0D))

			//	this.camera.add(tb.torusAt(0, 0, -200, 0x520D0D,5,2))
		}

		this.camera.add(tb.createFlashLight(this.scene));

		this.startRenderingLoop()
	}

	@HostListener('window:resize')
	onResize() {
		this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
		this.camera.updateProjectionMatrix()
	}

	private startRenderingLoop(): void {
		const comp = this;
		(function render() {
			requestAnimationFrame(render)
			comp.controls.render()
			comp.updatePlayerPosition()
			comp.webGLRenderer.render(comp.scene, comp.camera)
		})()
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

