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
	DoomTexture,
	Flat,
	FlatArea,
	FlatType,
	FlatWithHoles,
	FlatWithShapes,
	functions as mf,
	Linedef,
	RgbaBitmap,
	Vertex
} from "../wad/parser/wad-model"
import * as THREE from "three"
import {Side} from "three/src/constants"
import {Vector2} from "three/src/math/Vector2"
import {ColorRepresentation} from "three/src/utils"

const createWallDataTexture = (bitmap: RgbaBitmap): THREE.DataTexture => {
	const texture = new THREE.DataTexture(bitmap.rgba, bitmap.width, bitmap.height)
	texture.needsUpdate = true
	texture.format = THREE.RGBAFormat
	texture.type = THREE.UnsignedByteType
	texture.magFilter = THREE.NearestFilter
	texture.minFilter = THREE.NearestFilter
	texture.mapping = THREE.UVMapping
	texture.wrapS = THREE.RepeatWrapping
	texture.wrapT = THREE.RepeatWrapping
	return texture
}

const createFloorDataTexture = (bitmap: RgbaBitmap): THREE.DataTexture => {
	const texture = createWallDataTexture(bitmap)
	texture.repeat.set(0.02, 0.02)
	return texture
}

const createWallMaterial = (dt: DoomTexture, side: Side, color = null): THREE.Material => new THREE.MeshBasicMaterial({
	map: createWallDataTexture(dt),
	transparent: true,
	alphaTest: 0.5,
	side,
	color
})

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

// ############################ EXPORTS ############################
export const functions = {
	createFloorDataTexture,
	createWallMaterial,
	toVector2,
	createShapesFromFlatArea,
	createShapesFromFlatWithShapes,
	createShapesFromFlatWithHoles,
	point,
	createFallbackMaterial,
	createShapesFromFlat
}
