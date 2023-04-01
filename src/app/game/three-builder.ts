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

import * as R from 'ramda'
import {
	Bitmap,
	DoomMap,
	DoomTexture,
	Flat,
	FlatArea,
	FlatType,
	FlatWithHoles,
	FlatWithShapes,
	functions as mf,
	Linedef,
	LinedefBySector,
	LinedefFlag,
	RgbaBitmap,
	Sector,
	Vertex
} from "../wad/parser/wad-model"
import * as THREE from "three"
import {CineonToneMapping, LinearEncoding, LinearToneMapping, ReinhardToneMapping, Side} from "three/src/constants"
import {Vector2} from "three/src/math/Vector2"
import {ColorRepresentation} from "three/src/utils"
import {Either} from "../common/either";
import {BoxType, config as gc} from '../game-config'
import U from "../common/util";
import {GUI} from "dat.gui";

const createDataTexture = (bitmap: RgbaBitmap): THREE.DataTexture => {
	const texture = new THREE.DataTexture(bitmap.rgba, bitmap.width, bitmap.height)
	texture.needsUpdate = true
	texture.format = THREE.RGBAFormat
	texture.type = THREE.UnsignedByteType
	texture.magFilter = THREE.NearestFilter
	texture.minFilter = THREE.NearestFilter
	texture.mapping = THREE.UVMapping
	texture.wrapS = THREE.RepeatWrapping
	texture.wrapT = THREE.RepeatWrapping
	texture.anisotropy = gc.texture.anisotropy
	texture.minFilter = gc.texture.minFilter
	texture.magFilter = gc.texture.magFilter
	texture.flipY = true
	return texture
}

export type Sector3d = {
	flats: THREE.Mesh[],
	floors: THREE.Mesh[]
}

const createFloorDataTexture = (bitmap: RgbaBitmap): THREE.DataTexture => {
	const texture = createDataTexture(bitmap)
	texture.repeat.set(gc.floor.texture.repeat.x, gc.floor.texture.repeat.y)
	return texture
}

const createFlatMaterial = (texture: Either<Bitmap>, side: Side): THREE.Material =>
	texture.map(tx => createFloorDataTexture(tx)).map(tx => new THREE.MeshPhongMaterial({
		side,
		map: tx
	})).orElse(() => createFallbackMaterial())

const createWallMaterial = (dt: DoomTexture, wallWidth: number, side: Side, color = null): THREE.Material => {
	const map = createDataTexture(dt);
	map.repeat.x = wallWidth / dt.width
	const mesh =  new THREE.MeshPhysicalMaterial({
		map,
		transparent: false, //TODO only some textures has to be transparent
		side,
		color,
	});
	return mesh
}

const toVector2 = (ve: Vertex): Vector2 => new Vector2(ve.x, ve.y)

const createShapeFromPath = (path: Linedef[]): THREE.Shape => {
	return new THREE.Shape(mf.pathToPoints(path).map(p => toVector2(p)));
}

const createShapesFromFlatArea = (flat: FlatArea): THREE.Shape[] => {
	return [createShapeFromPath(flat.walls)];
}

const createShapesFromFlatWithShapes = (flat: FlatWithShapes): THREE.Shape[] => {
	return flat.walls.map(wall => createShapeFromPath(wall));
}

const createShapesFromFlatWithHoles = (flat: FlatWithHoles, renderHoles: boolean): THREE.Shape[] => {
	const shape = createShapeFromPath(flat.walls)
	if (renderHoles) {
		flat.holes.map(hole => createShapeFromPath(hole)).forEach(hole => shape.holes.push(hole))
	}
	return [shape];
}

const createShapesFromFlat = (flat: Flat, renderHoles: boolean): THREE.Shape[] =>
	R.cond<Flat[], THREE.Shape[]>([
		[(f) => f.type === FlatType.AREA, (f) => createShapesFromFlatArea(f as FlatArea)],
		[(f) => f.type === FlatType.SHAPES, (f) => createShapesFromFlatWithShapes(f as FlatWithShapes)],
		[R.T, (f) => createShapesFromFlatWithHoles(f as FlatWithHoles, renderHoles)]
	])(flat)

const point = (x: number, y: number, z: number, color: ColorRepresentation = 0xff0000): THREE.Object3D => {
	const dotGeometry = new THREE.BufferGeometry()
	dotGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([x, y, z]), 3))
	const dotMaterial = new THREE.PointsMaterial({size: 5, color})
	return new THREE.Points(dotGeometry, dotMaterial)
}

const createFallbackMaterial = () => new THREE.MeshStandardMaterial({
	transparent: true,
	color: 'green',
	side: THREE.DoubleSide
})

const createSky = (map: DoomMap): THREE.Mesh => {
	const minX = mf.findMinX(map.linedefs)
	const maxX = mf.findMaxX(map.linedefs)
	const minY = mf.findMinY(map.linedefs)
	const maxY = mf.findMaxY(map.linedefs)
	const type = gc.sky.box.type == BoxType.ORIGINAL && map.sky.isRight() ? BoxType.ORIGINAL : BoxType.BITMAP
	const adjust = gc.sky.adjust.filter(a => a.type === type)[0]
	const skyBox = new THREE.BoxGeometry(
		U.lineWidth(minX, maxX) + adjust.width,
		adjust.height,
		U.lineWidth(minY, maxY) + adjust.depth);

	const material = type == BoxType.ORIGINAL ? skyBoxOriginalMaterial(map.sky.val.patches[0].bitmap) : skyBoxBitmapMaterial()
	const mesh = new THREE.Mesh(skyBox, material);

	// set position to the middle of the map.
	mesh.position.set(maxX - U.lineWidth(minX, maxX) / 2, adjust.y, -maxY + U.lineWidth(minY, maxY) / 2)
	return mesh;
}

const orgBoxFactory = (map: THREE.DataTexture) => () => new THREE.MeshBasicMaterial({map, side: THREE.BackSide})

const emptyMaterial = () => new THREE.MeshBasicMaterial()

const skyBoxOriginalMaterial = (sky: Bitmap): THREE.MeshBasicMaterial[] => {
	const texture = createDataTexture(sky)
	const fact = orgBoxFactory(texture)
	return [fact(), fact(), emptyMaterial(), emptyMaterial(), fact(), fact()] // ft, bk, -, -, rt, lf
}

const boxPaths = (name, ext): string[] =>
	["ft", "bk", "up", "dn", "rt", "lf"].map(side =>
		'./assets/sky/' + name + '/' + side + '.' + ext)

const skyBoxBitmapMaterial = (): THREE.MeshBasicMaterial[] => boxPaths(gc.sky.box.bitmap.name, gc.sky.box.bitmap.ext).map(image =>
	new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load(image), side: THREE.BackSide})
);

const createWorld = (map: DoomMap): Sector3d => {
	const startTime = performance.now()

	const sectors: Sector3d[] = map.linedefBySector.map(renderSector)

	// Sector3d[] => ['V':Sector3d]
	const res = R.reduceBy((acc: Sector3d, el: Sector3d) => {
		acc.flats = [...acc.flats, ...el.flats]
		acc.floors = [...acc.floors, ...el.floors]
		return acc
	}, {flats: [], floors: []}, () => 'V', sectors)

	console.log('>TIME createWorld>', map.mapDirs[0].name, '=', performance.now() - startTime, 'ms')
	return res['V']
}

const renderSector = (lbs: LinedefBySector): Sector3d => {
	//if (lbs.sector.id !== 28) {
	//	return;
//	}
	// wall
	let flats = renderWalls(lbs)

	// floor
	const floors = renderFlat(lbs.flat, lbs.sector.floorTexture, lbs.sector.floorHeight, true, 'Floor')
	flats = [...flats, ...floors]

	// celling
	const celling = renderFlat(lbs.flat, lbs.sector.cellingTexture, lbs.sector.cellingHeight, false, 'Celling');
	flats = [...flats, ...celling]

	return {flats, floors};
}

const renderFlat = (flat: Flat, texture: Either<Bitmap>, height: number, renderHoles: boolean, type: string): THREE.Mesh[] => {
	if (texture.isRight() && texture.val.name.includes("SKY")) {
		return []; // SKY should be transparent so that the player can see the sky.
	}

	const mesh = new THREE.Mesh(new THREE.ShapeGeometry(createShapesFromFlat(flat, renderHoles)),
		createFlatMaterial(texture, THREE.DoubleSide))
	mesh.rotation.set(Math.PI / 2, Math.PI, Math.PI)
	mesh.position.y = height
	mesh.name = type + ':' + flat.sector.id;
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
			(ld, wallHeight) => Math.max(ld.sector.cellingHeight, ld.backSide.val.sector.cellingHeight) - wallHeight / 2,
			wallHeight)(ld)
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
			(ld, wallHeight) => Math.max(ld.sector.floorHeight, ld.backSide.val.sector.floorHeight) - wallHeight / 2,
			height)(ld)
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
	const material = createWallMaterial(texture, wallWidth, sideF(ld), color)

	const mesh = new THREE.Mesh(new THREE.PlaneGeometry(wallWidth, wallHeight), material)
	mesh.position.set((vs.x + ve.x) / 2, wallOffsetFunc(ld, wallHeight), -(vs.y + ve.y) / 2)
	mesh.rotateY(Math.atan2(ve.y - vs.y, ve.x - vs.x))
	mesh.receiveShadow = true
	return mesh
}

const boxAt = (x: number, y: number, z: number, dim = 5, color = 0x00ff00): THREE.Object3D => {
	const geometry = new THREE.BoxGeometry(dim, dim, dim);
	const segments = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({color}));
	segments.position.set(x, y, z)
	return segments;
}

const torusAt = (x: number, y: number, z: number, color = 0x00ff00, radius = 20, tube = 5): THREE.Object3D => {
	const mesh = new THREE.Mesh(
		new THREE.TorusGeometry(radius, tube, 32, 32),
		new THREE.MeshPhongMaterial({wireframe: false, color})
	);
	mesh.position.set(x, y, z)
	return mesh;
}

const createAmbientLight = () =>
	new THREE.AmbientLight(gc.scene.ambientLight.color, gc.scene.ambientLight.intensity);

const createScene = (): THREE.Scene => {
	const scene = new THREE.Scene()

	if (gc.scene.scale > 1) { // TODO - not working after: this.scene.add(this.camera)
		scene.scale.set(gc.scene.scale, gc.scene.scale, gc.scene.scale)
	}

	scene.background = new THREE.Color(gc.sky.color);
	axesHelper().exec(ah => scene.add(ah))
	scene.add(createAmbientLight())
	return scene
}

const axesHelper = (): Either<THREE.AxesHelper> => {
	const ah = gc.scene.debug.axesHelper;
	return Either.ofCondition(() => ah.visible, () => 'Axes helper disabled',
		() => new THREE.AxesHelper(500).setColors(new THREE.Color(ah.colors.x), new THREE.Color(ah.colors.y), new THREE.Color(ah.colors.z)))
}

const createCamera = (canvas: HTMLCanvasElement): THREE.PerspectiveCamera => {
	const cam = new THREE.PerspectiveCamera(
		gc.camera.perspective.fov,
		canvas.clientWidth / canvas.clientHeight,
		gc.camera.perspective.near,
		gc.camera.perspective.far)
	return cam;
}

const positionCamera = (camera: THREE.Camera, map: DoomMap) =>
	map.player.exec(player => camera.position.set(player.position.x, gc.player.height, -player.position.y))

const createWebGlRenderer = (canvas: HTMLCanvasElement): THREE.WebGLRenderer => {
	const renderer = new THREE.WebGLRenderer({antialias: gc.renderer.antialias, canvas})
	renderer.physicallyCorrectLights = gc.renderer.physicallyCorrectLights

	// a beam from the flashlight does not dazzle when getting close to the wall
	renderer.toneMapping = THREE.CineonToneMapping

	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

	if (gc.renderer.resolution.width > 0) {
		renderer.setSize(gc.renderer.resolution.width, gc.renderer.resolution.height)
	} else {
		renderer.setSize(canvas.clientWidth, canvas.clientHeight)
		renderer.setPixelRatio(window.devicePixelRatio)
	}
	return renderer
}

const createSpotLightFolder = (gui: GUI, scene: THREE.Scene) => (name: string, sl): GUI => {
	const gf = gui.addFolder(name)

	gf.add(sl, 'angle', Math.PI / 2, Math.PI).step(0.1)
	gf.add(sl, 'decay', 0.5, 3).step(0.1)
	gf.add(sl, 'penumbra', 0, 1).step(0.1)
	gf.add(sl, 'intensity', 0, 10000)
	gf.add(sl, 'distance', 0, 10000)
	gf.add(sl, 'castShadow')

	gf.add({
		cross: () => {
			scene.add(new THREE.SpotLightHelper(sl))
		}
	}, 'cross').name('SpotLightHelper');
	gf.open()
	return gf;
}

const emptyFunction = () => null

const createRing = (flashLight: THREE.Group, folderFunction: (f, d) => any) => (color: ColorRepresentation, name: string, props?: keyof THREE.SpotLight): THREE.SpotLight => {
	const ring = new THREE.SpotLight(color, gc.flashLight.intensity, 0)
	ring.penumbra = gc.flashLight.penumbra
	ring.castShadow = gc.flashLight.castShadow

	folderFunction(name, ring)
	flashLight.add(ring)
	flashLight.add(ring.target)
	return ring;
}

const createFlashLight = (scene: THREE.Scene): THREE.Object3D => {
	const flashLight = new THREE.Group()
	const createRingF = createRing(flashLight, gc.flashLight.debug.gui ? createSpotLightFolder(new GUI(), scene) : emptyFunction)
	flashLight.rotateX(Math.PI / 2)

	// light diffusion trough room
	{
		const ring = createRingF(0xebd68f, 'Light Diffusion', 'intensity')
		ring.angle = Math.PI
		ring.decay = 1.4
		ring.castShadow = gc.flashLight.castShadow
	}

	// light diffusion around main beam
	{
		const ring = createRingF(0xe8b609, 'Ring 1')
		ring.angle = 0.39
		ring.decay = 1.4
	}

	// rings going from outside into center
	{
		const ring = createRingF(0xd9c47c, 'Ring 2')
		ring.angle = 0.16
		ring.decay = 1.5
	}

	{
		const ring = createRingF(0xb09a4c, 'Ring 3')
		ring.angle = 0.14
		ring.decay = 1.5
	}

	{
		const ring = createRingF(0x75652b, 'Ring 4')
		ring.angle = 0.13
		ring.decay = 1.5
	}

	return flashLight;
}

// ############################ EXPORTS ############################
export const testFunctions = {
	boxPaths
}

export const functions = {
	createSky,
	createCamera,
	createWebGlRenderer,
	createScene,
	createWorld,
	boxAt,
	torusAt,
	createFlashLight,
	positionCamera
}
