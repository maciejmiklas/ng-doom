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
	ThingType,
	Vertex
} from "../wad/parser/wad-model"
import * as THREE from "three"
import {Side} from "three/src/constants"
import {Vector2} from "three/src/math/Vector2"
import {ColorRepresentation} from "three/src/utils"
import {Either} from "../common/either";
import {BoxType, config as gc} from '../game-config'
import U from "../common/util";

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
	return new THREE.MeshBasicMaterial({
		map,
		transparent: true, //TODO only some textures has to be transparent
		alphaTest: 0,
		side,
		color
	});
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
	// TODO  new THREE.Fog( 0xcccccc, 5000, 7000 );
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

	console.log('>TIME createWorld>', map.mapDirs[0].name, performance.now() - startTime)
	return res['V']
}

const setupCamera = (camera: THREE.PerspectiveCamera, map: DoomMap): void => {
	const player = map.things.filter(th => th.thingType == ThingType.PLAYER)[0]
	camera.position.set(player.position.x * gc.scene.scale, gc.player.height * gc.scene.scale, -player.position.y * gc.scene.scale)
}

const renderSector = (lbs: LinedefBySector): Sector3d => {
	//if (lbs.sector.id !== 28) {
	//	return;
//	}
	// wall
	let flats = renderWalls(lbs)

	// floor
	const floors = renderFlat(lbs.flat, lbs.sector.floorTexture, lbs.sector.floorHeight, true)
	flats = [...flats, ...floors]

	// celling
	const celling = renderFlat(lbs.flat, lbs.sector.cellingTexture, lbs.sector.cellingHeight, false);
	flats = [...flats, ...celling]

	return {flats, floors};
}

const renderFlat = (flat: Flat, texture: Either<Bitmap>, height: number, renderHoles: boolean): THREE.Mesh[] => {
	if (texture.isRight() && texture.val.name.includes("SKY")) {
		return []; // SKY should be transparent so that the player can see the sky.
	}

	const mesh = new THREE.Mesh(new THREE.ShapeGeometry(createShapesFromFlat(flat, renderHoles)),
		createFlatMaterial(texture, THREE.DoubleSide))
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
	const material = createWallMaterial(texture, wallWidth, sideF(ld), color)
	const mesh = new THREE.Mesh(new THREE.PlaneGeometry(wallWidth, wallHeight), material)
	mesh.position.set((vs.x + ve.x) / 2, wallOffsetFunc(ld, wallHeight), -(vs.y + ve.y) / 2)
	mesh.rotateY(Math.atan2(ve.y - vs.y, ve.x - vs.x))
	return mesh
}

const createScene = (): THREE.Scene => {
	const scene = new THREE.Scene()
	scene.background = new THREE.Color(gc.sky.color);
	axesHelper().exec(ah => scene.add(ah))
	const light = new THREE.HemisphereLight(0XFFFFCC, 0X19BBDC, 1.0)
	light.position.set(0, 0, 0)
	light.visible = true
	scene.add(light)
	return scene
}

const axesHelper = (): Either<THREE.AxesHelper> => {
	const ah = gc.debug.axesHelper;
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

const createWebGlRenderer = (canvas: HTMLCanvasElement): THREE.WebGLRenderer => {
	const renderer = new THREE.WebGLRenderer({antialias: gc.renderer.antialias, canvas})
	renderer.physicallyCorrectLights = gc.renderer.physicallyCorrectLights
	renderer.setSize(canvas.clientWidth, canvas.clientHeight)
	renderer.setPixelRatio(window.devicePixelRatio)
	return renderer
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
	setupCamera
}
