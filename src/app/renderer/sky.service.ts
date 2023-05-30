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
import {Bitmap, DoomMap, functions as MF} from "../wad/parser/wad-model";
import * as T from "three";
import {config as GC} from "../game-config";
import U from "../common/util";
import {functions as TF} from "./texture-factory";

@Injectable({
	providedIn: 'root'
})
export class SkyService {

	createSky({linedefs, sky}: DoomMap): T.Mesh {
		const minX = MF.findMinX(linedefs)
		const maxX = MF.findMaxX(linedefs)
		const minY = MF.findMinY(linedefs)
		const maxY = MF.findMaxY(linedefs)
		const type = GC.sky.box.type == GC.BoxType.ORIGINAL && sky.isRight() ? GC.BoxType.ORIGINAL : GC.BoxType.BITMAP
		const adjust = GC.sky.adjust.filter(a => a.type === type)[0]
		const skyBox = new T.BoxGeometry(
			U.lineWidth(minX, maxX) + adjust.width,
			adjust.height,
			U.lineWidth(minY, maxY) + adjust.depth);

		const material = type == GC.BoxType.ORIGINAL ? skyBoxOriginalMaterial(sky.val.patches[0].bitmap) : skyBoxBitmapMaterial()
		const mesh = new T.Mesh(skyBox, material);

		// set position to the middle of the map.
		mesh.position.set(maxX - U.lineWidth(minX, maxX) / 2, adjust.y, -maxY + U.lineWidth(minY, maxY) / 2)
		return mesh;
	}
}

const orgBoxFactory = (map: T.DataTexture) => () => new T.MeshStandardMaterial({map, side: T.BackSide})

const emptyMaterial = () => new T.MeshStandardMaterial()

const skyBoxOriginalMaterial = (sky: Bitmap): T.MeshStandardMaterial[] => {
	const texture = TF.createDataTexture(sky)
	const fact = orgBoxFactory(texture)
	return [fact(), fact(), emptyMaterial(), emptyMaterial(), fact(), fact()] // ft, bk, -, -, rt, lf
}

const boxPaths = (name, ext): string[] =>
	["ft", "bk", "up", "dn", "rt", "lf"].map(side =>
		'./assets/sky/' + name + '/' + side + '.' + ext)

const skyBoxBitmapMaterial = (): T.MeshStandardMaterial[] => boxPaths(GC.sky.box.bitmap.name, GC.sky.box.bitmap.ext).map(image =>
	new T.MeshStandardMaterial({map: new T.TextureLoader().load(image), side: T.BackSide})
);

// ############################ EXPORTS ############################
export const testFunctions = {
	boxPaths
}
