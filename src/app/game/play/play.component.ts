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
		this.map = this.wad.maps[gc.game.startMap]
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
			//console.log('>SECTOR>', inters[0].object.name)
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
	const player = map.things.filter(th => th.thingType == ThingType.PLAYER)[0]
	camera.position.set(player.position.x, gc.player.height, -player.position.y)
}

const renderSector = (scene: THREE.Scene, florCallback: (floor: THREE.Mesh) => void) => (lbs: LinedefBySector) => {
	//if (lbs.sector.id !== 28) {
	//	return;
//	}
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
	if (texture.isRight() && texture.val.name.includes("SKY")) {
		// SKY flat should be transparent so that the player can see the sky.
		return [];
	}

	const mesh = new THREE.Mesh(new THREE.ShapeGeometry(tm.createShapesFromFlat(flat, renderHoles)),
		tm.createFlatMaterial(texture, THREE.DoubleSide))
	mesh.rotation.set(Math.PI / 2, Math.PI, Math.PI)
	mesh.position.y = height
	mesh.name = 'Sector:' + flat.sector.id;
	return [mesh]
}

/** front side -> upper wall */
const renderUpperWall = (sector: Sector) => (ld: Linedef): Either<THREE.Mesh[]> => {
	if (ld.backSide.isLeft()) {
		return Either.ofLeft(() => 'No upper wall for one sided Linedef: ' + ld.id)
	}

	// when current Linedef belongs to current Sector take front-side texture, otherwise try backside as we are looking at
	// the back wall of another Sector
	const texture = Either.ofCondition(
		() => sector.id !== ld.sector.id,
		() => 'Backside has no upper texture on: ' + ld.id,
		() => ld.backSide.val.upperTexture).orElse(() => ld.frontSide.upperTexture)

	if (texture.isLeft()) {
		return Either.ofLeft(() => 'No texture for upper wall: ' + ld.id)
	}

	const wallHeight = (lde) => Math.abs(lde.sector.cellingHeight - lde.backSide.val.sector.cellingHeight)
	const mesh = ld.flags.has(LinedefFlag.UPPER_TEXTURE_UNPEGGED) ?
		// the upper texture will begin at the higher ceiling and be drawn downwards.
		wall(() => THREE.DoubleSide, texture.val,
			(ld, wallHeight) => Math.max(ld.sector.cellingHeight, ld.backSide.val.sector.cellingHeight) + wallHeight / 2,
			(ld) => wallHeight(ld) * -1)(ld)
		:
		// the upper texture is pegged to the lowest ceiling
		wall(() => THREE.DoubleSide, texture.val,
			(ld, wallHeight) => Math.min(ld.sector.cellingHeight, ld.backSide.val.sector.cellingHeight) + wallHeight / 2,
			wallHeight)(ld)

	return Either.ofRight([mesh])
}

/**
 * front side -> middle wall part.
 *
 * The top of the texture is at the ceiling, the texture continues downward to the floor.
 */
const renderMiddleWall = (ld: Linedef): Either<THREE.Mesh[]> => {
	return Either.ofTruth([ld.frontSide.middleTexture],
		() => [wall(() => THREE.DoubleSide, ld.frontSide.middleTexture.val,
			(ld, wallHeight) => ld.sector.floorHeight + wallHeight / 2,
			(ld) => ld.sector.cellingHeight - ld.sector.floorHeight)(ld)])
}

/** front side -> lower wall part */
const renderLowerWall = (sector: Sector) => (ld: Linedef): Either<THREE.Mesh[]> => {
	if (ld.backSide.isLeft()) {
		return Either.ofLeft(() => 'No lower wall for single sided Linedef: ' + ld.id)
	}

	// when current Linedef belongs to current Sector take front-side texture, otherwise try backside as we are looking at
	// the back wall of another Sector
	const texture = Either.ofCondition(
		() => sector.id !== ld.sector.id,
		() => 'Backside has no lower texture on: ' + ld.id,
		() => ld.backSide.val.lowerTexture).orElse(() => ld.frontSide.lowerTexture)

	if (texture.isLeft()) {
		return Either.ofLeft(() => 'No texture for lower wall: ' + ld.id)
	}

	const height = (lde) => Math.abs(lde.sector.floorHeight - lde.backSide.val.sector.floorHeight)
	const mesh = ld.flags.has(LinedefFlag.LOWER_TEXTURE_UNPEGGED) ?
		// the upper texture is pegged to the highest flor
		wall(() => THREE.DoubleSide, texture.val,
			(ld, wallHeight) => Math.max(ld.sector.floorHeight, ld.backSide.val.sector.floorHeight) + wallHeight / 2,
			(ld) => height(ld) * -1)(ld)
		:
		// the upper texture is pegged to the lowest flor
		wall(() => THREE.DoubleSide, texture.val,
			(ld, wallHeight) => Math.min(ld.sector.floorHeight, ld.backSide.get().sector.floorHeight) + wallHeight / 2,
			height)(ld)

	return Either.ofRight([mesh])
}

// https://doomwiki.org/wiki/Texture_alignment
// https://doomwiki.org/wiki/Sidedef
const renderWalls = (lbs: LinedefBySector): THREE.Mesh[] => {
	let mesh: THREE.Mesh[] = []

	const upperWallRenderer = renderUpperWall(lbs.sector);
	const lowerWallRenderer = renderLowerWall(lbs.sector);
	// TODO render middleTexture: Middle floating textures can be used to achieve a variety of faux 3D effects such as 3D bridge
	lbs.linedefs.forEach(ld => {
		mesh = renderMiddleWall(ld).map(m => mesh.concat(m)).orElse(() => mesh)
		mesh = upperWallRenderer(ld).map(m => mesh.concat(m)).orElse(() => mesh)
		mesh = lowerWallRenderer(ld).map(m => mesh.concat(m)).orElse(() => mesh)
	})
	return mesh
}

const wall = (sideF: (ld: Linedef) => Side,
							texture: DoomTexture,
							wallOffsetFunc: (ld: Linedef, wallHeight: number) => number,
							wallHeightFunc: (ld: Linedef) => number) => (ld: Linedef, color = null): THREE.Mesh => {
	const wallHeight = wallHeightFunc(ld)
	const vs = ld.start
	const ve = ld.end
	const wallWidth = Math.hypot(ve.x - vs.x, ve.y - vs.y)
	const material = tm.createWallMaterial(texture, wallWidth, sideF(ld), color)
	const mesh = new THREE.Mesh(new THREE.PlaneGeometry(wallWidth, wallHeight), material)
	mesh.position.set((vs.x + ve.x) / 2, wallOffsetFunc(ld, wallHeight), (vs.y + ve.y) / -2)
	mesh.rotateY(Math.atan2(ve.y - vs.y, ve.x - vs.x))
	return mesh
}

const createScene = (): THREE.Scene => {
	const scene = new THREE.Scene()
	scene.background = new THREE.Color(gc.sky.color)
	if (gc.debug.axesHelper) {
		scene.add(new THREE.AxesHelper(500).setColors(new THREE.Color('red'), new THREE.Color('black'), new THREE.Color('green')))
	}

	const light = new THREE.HemisphereLight(0XFFFFCC, 0X19BBDC, 1.0)
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
	const renderer = new THREE.WebGLRenderer({antialias: gc.renderer.antialias, canvas})
	renderer.physicallyCorrectLights = gc.renderer.physicallyCorrectLights
	renderer.setSize(canvas.clientWidth, canvas.clientHeight)
	renderer.setPixelRatio(window.devicePixelRatio)
	return renderer
}
