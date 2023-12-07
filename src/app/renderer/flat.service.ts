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
import {Flat, functions as MF, Linedef, RgbaBitmap, Vertex} from "../wad/parser/wad-model"
import * as T from "three"
import {functions as TF} from "./texture-factory"
import {config as GC} from "../game-config"
import {Either} from "../common/either"

@Injectable({
	providedIn: 'root'
})
export class FlatService {

	renderFlat(flat: Flat, texture: Either<RgbaBitmap>, height: number, renderHoles: boolean, type: string): Either<T.Mesh> {
		if (texture.isRight() && texture.get().name.includes("SKY")) {
			return Either.ofLeft(() => 'Ignoring SKY') // SKY should be transparent so that the player can see the sky.
		}

		const shapes = createShapesFromFlat(flat, renderHoles)
		const mesh = new T.Mesh(new T.ShapeGeometry(shapes), createFlatMaterial(texture, T.DoubleSide))
		mesh.rotation.set(Math.PI / 2, Math.PI, Math.PI)
		mesh.position.y = height
		mesh.name = type + ':' + flat.sector.id
		mesh.receiveShadow = GC.flat.shadow.receive
		mesh.castShadow = GC.flat.shadow.cast
		return Either.ofRight(mesh)
	}
}

const createFlatDataTexture = (bitmap: RgbaBitmap): T.DataTexture => {
	const texture = TF.createDataTexture(bitmap)
	texture.repeat.set(GC.flat.texture.repeat.x, GC.flat.texture.repeat.y)
	return texture
}

const createFallbackMaterial = () => new T.MeshStandardMaterial({
	transparent: false,
	color: 'green',
	side: T.DoubleSide
})

const createFlatMaterial = (texture: Either<RgbaBitmap>, side: T.Side): T.Material =>
	texture.map(createFlatDataTexture).map(tx => new T.MeshStandardMaterial({
		side,
		map: tx
	})).orElse(() => createFallbackMaterial())

const toVector2 = (ve: Vertex): T.Vector2 => new T.Vector2(ve.x, ve.y)

const createShapeFromPath = (path: Linedef[]): T.Shape => new T.Shape(MF.pathToPoints(path).map(toVector2))

const createShapesFromFlat = (flat: Flat, renderHoles: boolean): T.Shape[] => {
	const shapes = flat.walls.map(createShapeFromPath)
	if (renderHoles) {
		flat.holes.exec(holes => holes.map(hole => createShapeFromPath(hole)).forEach(hole => shapes[0].holes.push(hole)))
	}
	return shapes
}
