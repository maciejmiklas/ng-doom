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
import {Injectable} from '@angular/core';
import {
	Bitmap,
	Flat,
	FlatArea,
	FlatType,
	FlatWithHoles,
	FlatWithShapes,
	functions as MF,
	Linedef,
	RgbaBitmap,
	Vertex
} from "../wad/parser/wad-model";
import * as T from "three";
import {functions as TF} from "./texture-factory";
import {config as GC} from "../game-config";
import {Either} from "../common/either";
import * as R from "ramda";

@Injectable({
	providedIn: 'root'
})
export class FlatService {

	renderFlat(flat: Flat, texture: Either<Bitmap>, height: number, renderHoles: boolean, type: string): T.Mesh[] {
		if (texture.isRight() && texture.val.name.includes("SKY")) {
			return []; // SKY should be transparent so that the player can see the sky.
		}

		const mesh = new T.Mesh(new T.ShapeGeometry(createShapesFromFlat(flat, renderHoles)),
			createFlatMaterial(texture, T.DoubleSide))
		mesh.rotation.set(Math.PI / 2, Math.PI, Math.PI)
		mesh.position.y = height
		mesh.name = type + ':' + flat.sector.id;
		mesh.receiveShadow = GC.flat.shadow.receive
		mesh.castShadow = GC.flat.shadow.cast
		return [mesh]
	}
}

const createFlatDataTexture = (bitmap: RgbaBitmap): T.DataTexture => {
	const texture = TF.createDataTexture(bitmap)
	texture.repeat.set(GC.flat.texture.repeat.x, GC.flat.texture.repeat.y)
	return texture
}

const createFallbackMaterial = () => new T.MeshStandardMaterial({
	transparent: true,
	color: 'green',
	side: T.DoubleSide
})

const createFlatMaterial = (texture: Either<Bitmap>, side: T.Side): T.Material =>
	texture.map(createFlatDataTexture).map(tx => new T.MeshStandardMaterial({
		side,
		map: tx
	})).orElse(() => createFallbackMaterial())


const toVector2 = (ve: Vertex): T.Vector2 => new T.Vector2(ve.x, ve.y)

const createShapeFromPath = (path: Linedef[]): T.Shape => new T.Shape(MF.pathToPoints(path).map(toVector2))

const createShapesFromFlatArea = ({walls: fw}: FlatArea): T.Shape[] => [createShapeFromPath(fw)];

const createShapesFromFlatWithShapes = ({walls: fw}: FlatWithShapes): T.Shape[] => fw.map(createShapeFromPath);

const createShapesFromFlatWithHoles = ({walls: fw, holes: fh}: FlatWithHoles, renderHoles: boolean): T.Shape[] => {
	const shape = createShapeFromPath(fw)
	if (renderHoles) {
		fh.map(hole => createShapeFromPath(hole)).forEach(hole => shape.holes.push(hole))
	}
	return [shape];
}

const createShapesFromFlat = (flat: Flat, renderHoles: boolean): T.Shape[] =>
	R.cond<Flat[], T.Shape[]>([
		[(f) => f.type === FlatType.AREA, createShapesFromFlatArea],
		[(f) => f.type === FlatType.SHAPES, createShapesFromFlatWithShapes],
		[R.T, (f) => createShapesFromFlatWithHoles(f as FlatWithHoles, renderHoles)]
	])(flat)
