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
import {Component, ElementRef, OnInit, ViewChild} from '@angular/core'
import * as THREE from 'three'
import {Controls} from '../controls'
import {WadStorageService} from '../../wad/wad-storage.service'
import {
	Bitmap,
	DoomMap,
	DoomTexture,
	Flat,
	Linedef,
	LinedefBySector,
	LinedefFlag,
	Sector,
	ThingType,
	Wad
} from '../../wad/parser/wad-model'

import {functions as tm} from '../three-mapper'
import {Either} from '../../common/either'
import {Side} from 'three/src/constants'
import {config as gc} from '../game-config'
import {PlaneGeometry} from "three/src/geometries/PlaneGeometry";

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
	private floors: THREE.Mesh[] = []
	private raycaster: THREE.Raycaster

	constructor(private wadStorage: WadStorageService) {
	}

	private get canvas(): HTMLCanvasElement {
		return this.canvasRef.nativeElement
	}

	ngOnInit(): void {
		this.wad = this.wadStorage.getCurrent().get().wad
		this.camera = createCamera(this.canvas)
		this.scene = createScene()
		this.webGLRenderer = createWebGlRenderer(this.canvas)
		this.map = this.wad.maps[gc.game.startLevel]
		this.createWorld(this.scene, this.map)
		setupCamera(this.camera, this.map)
		this.camera.lookAt(this.scene.position)
		this.controls = new Controls(this.camera, this.canvas)
		this.raycaster = new THREE.Raycaster()

		this.startRenderingLoop()
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

		this.raycaster.ray.origin.y += 400
		const inters = this.raycaster.intersectObjects(this.floors)
		if (inters.length > 0) {
			cp.y = inters[0].point.y + gc.player.height
		}
	}

	private createWorld(scene: THREE.Scene, map: DoomMap) {
		const startTime = performance.now()

		map.linedefBySector.forEach(renderSector(scene, fl => this.floors.push(fl)))
		console.log('>TIME createWorld>', map.mapDirs[0].name, performance.now() - startTime)
	}
}

const setupCamera = (camera: THREE.PerspectiveCamera, map: DoomMap) => {
	//camera.position.set(1032, 500, 2170)
	const player = map.things.filter(th => th.thingType == ThingType.PLAYER)[0]
	camera.position.set(player.position.x, gc.player.height, -player.position.y)
}

const renderSector = (scene: THREE.Scene, florCallback: (floor: THREE.Mesh) => void) => (lbs: LinedefBySector) => {
	//if (lbs.sector.id !== 39) {
	//	return
	//}

	renderWalls(lbs).forEach(m => scene.add(m))

	// floor
	renderFlat(lbs.flat, lbs.sector.floorTexture, lbs.sector.floorHeight, true).forEach(m => {
		florCallback(m)
		scene.add(m)
	})

	// celling
	renderFlat(lbs.flat, lbs.sector.cellingTexture, lbs.sector.cellingHeight, false).forEach(m => {
		scene.add(m)
	})
}

const renderFlat = (flat: Flat, texture: Either<Bitmap>, height: number, renderHoles: boolean): THREE.Mesh[] => {
	const shapes = tm.createShapesFromFlat(flat, renderHoles)
	const geometry = new THREE.ShapeGeometry(shapes)
	const material = texture.map(tx => tm.createFloorDataTexture(tx)).map(tx => new THREE.MeshPhongMaterial({
		side: THREE.DoubleSide,
		map: tx
	})).orElse(() => tm.createFallbackMaterial())

	const mesh = new THREE.Mesh(geometry, material)
	mesh.rotation.set(Math.PI / 2, Math.PI, Math.PI)
	mesh.position.y = height
	return [mesh]
}


/** front side -> upper wall */
const renderUpperWall = (sector: Sector, ld: Linedef): THREE.Mesh[] => {
	const mesh: THREE.Mesh[] = []

	const wallHeight = (ld) => Math.abs(ld.sector.cellingHeight - ld.backSide.get().sector.cellingHeight)

	// when current Linedef belongs to current Sector take front-side texture, otherwise try backside as we are looking at
	// the back wall of another Sector
	const texture = (ld) => sector.id !== ld.sector.id && ld.backSide.isRight() && ld.backSide.get().upperTexture.isRight() ?
		ld.backSide.get().upperTexture.get() : ld.frontSide.upperTexture.get()

	const side = () => THREE.DoubleSide
	const condition = [ld.frontSide.upperTexture, ld.backSide]

	// the upper texture will begin at the higher ceiling and be drawn downwards.
	const unpegged = ld.flags.has(LinedefFlag.UPPER_TEXTURE_UNPEGGED)
	wall(() => [...condition, Either.ofBoolean(unpegged)],
		side,
		texture,
		(ld, wallHeight) => Math.max(ld.sector.cellingHeight, ld.backSide.get().sector.cellingHeight) + wallHeight / 2,
		(ld) => wallHeight(ld) * -1)(ld).exec(m => mesh.push(m))

	// the upper texture is pegged to the lowest ceiling
	wall(() => [...condition, Either.ofBoolean(!unpegged)],
		side,
		texture,
		(ld, wallHeight) => Math.min(ld.sector.cellingHeight, ld.backSide.get().sector.cellingHeight) + wallHeight / 2,
		wallHeight)(ld).exec(m => mesh.push(m))
	return mesh
}

/**
 * front side -> middle wall part.
 *
 * The top of the texture is at the ceiling, the texture continues downward to the floor.
 */
const renderMiddleWall = (ld: Linedef): THREE.Mesh[] => {
	const mesh: THREE.Mesh[] = []

	wall(() => [ld.frontSide.middleTexture],
		() => THREE.DoubleSide,
		(ld) => ld.frontSide.middleTexture.get(),
		(ld, wallHeight) => ld.sector.floorHeight + wallHeight / 2,
		(ld) => ld.sector.cellingHeight - ld.sector.floorHeight)(ld).exec(m => mesh.push(m))

	return mesh
}

/** front side -> lower wall part */
const renderLowerWall = (sector: Sector, ld: Linedef): THREE.Mesh[] => {
	const mesh: THREE.Mesh[] = []

	const lowerUnpegged = ld.flags.has(LinedefFlag.LOWER_TEXTURE_UNPEGGED)
	const side = () => THREE.DoubleSide

	// when current Linedef belongs to current Sector take front-side texture, otherwise try backside as we are looking at
	// the back wall of another Sector
	const texture = (ld) => sector.id !== ld.sector.id && ld.backSide.isRight() && ld.backSide.get().lowerTexture.isRight() ?
		ld.backSide.get().lowerTexture.get() : ld.frontSide.lowerTexture.get()

	const condition = [ld.frontSide.lowerTexture, ld.backSide]
	const height = (ld) => Math.abs(ld.sector.floorHeight - ld.backSide.get().sector.floorHeight)

	// the upper texture is pegged to the highest flor
	wall(() => [...condition, Either.ofBoolean(lowerUnpegged)],
		side,
		texture,
		(ld, wallHeight) => Math.max(ld.sector.floorHeight, ld.backSide.get().sector.floorHeight) + wallHeight / 2,
		(ld) => height(ld) * -1)(ld).exec(m => mesh.push(m))

	// the upper texture is pegged to the lowest flor
	wall(() => [...condition, Either.ofBoolean(!lowerUnpegged)],
		side,
		texture,
		(ld, wallHeight) => Math.min(ld.sector.floorHeight, ld.backSide.get().sector.floorHeight) + wallHeight / 2,
		height)(ld).exec(m => mesh.push(m))

	return mesh
}

// https://doomwiki.org/wiki/Texture_alignment
// https://doomwiki.org/wiki/Sidedef
const renderWalls = (lbs: LinedefBySector): THREE.Mesh[] => {
	let mesh: THREE.Mesh[] = []

	// TODO render middleTexture: Middle floating textures can be used to achieve a variety of faux 3D effects such as 3D bridge
	lbs.linedefs.forEach(ld => {
		mesh = mesh.concat(renderMiddleWall(ld))
		mesh = mesh.concat(renderUpperWall(lbs.sector, ld))
		mesh = mesh.concat(renderLowerWall(lbs.sector, ld))
	})

	return mesh
}

const wall = (precondition: () => Either<any>[],
							sideFunc: (ld: Linedef) => Side,
							textureFunc: (ld: Linedef) => DoomTexture,
							wallOffsetFunc: (ld: Linedef, wallHeight: number) => number,
							wallHeightFunc: (ld: Linedef) => number) => (ld: Linedef, color = null): Either<THREE.Mesh> => {
	return Either.ofTruth(precondition(), () => {
		const wallHeight = wallHeightFunc(ld)
		const vs = ld.start
		const ve = ld.end
		const wallWidth = Math.hypot(ve.x - vs.x, ve.y - vs.y)
		const material = tm.createWallMaterial(textureFunc(ld), sideFunc(ld), color)
		const mesh = new THREE.Mesh(new THREE.PlaneGeometry(wallWidth, wallHeight), material)
		mesh.position.set((vs.x + ve.x) / 2, wallOffsetFunc(ld, wallHeight), (vs.y + ve.y) / -2)
		mesh.rotateY(Math.atan2(ve.y - vs.y, ve.x - vs.x))
		return mesh
	})
}

const createScene = (): THREE.Scene => {
	const scene = new THREE.Scene()
	scene.background = new THREE.Color('skyblue')
	//scene.add(new THREE.AxesHelper(500).setColors(new THREE.Color('red'), new THREE.Color('black'), new THREE.Color('green')))
	const light = new THREE.HemisphereLight(0XFFFFCC, 0X19BBDC, 1.5)
	light.position.set(0, 0, 0)
	light.visible = true
	scene.add(light)
	return scene
}

const createCamera = (canvas: HTMLCanvasElement): THREE.PerspectiveCamera =>
	new THREE.PerspectiveCamera(
		gc.camera.perspective.fov,
		canvas.clientWidth / canvas.clientHeight,
		gc.camera.perspective.near,
		gc.camera.perspective.far)

const createWebGlRenderer = (canvas: HTMLCanvasElement): THREE.WebGLRenderer => {
	const renderer = new THREE.WebGLRenderer({antialias: true, canvas})
	renderer.physicallyCorrectLights = true
	renderer.setSize(canvas.clientWidth, canvas.clientHeight)
	renderer.setPixelRatio(window.devicePixelRatio)
	return renderer
}
