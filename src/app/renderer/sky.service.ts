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
import {Injectable} from '@angular/core'
import {Bitmap, DoomMap, functions as MF, Wad} from "../wad/parser/wad-model"
import * as T from "three"
import {config as GC} from "../game-config"
import U from "../common/util"
import {functions as TF} from "./texture-factory"
import {BuildMapCallback} from "./callbacks"
import {MeshStandardMaterialParameters} from "three/src/materials/MeshStandardMaterial"

@Injectable({
	providedIn: 'root'
})
export class SkyService implements BuildMapCallback {

	buildMap(wad: Wad, mapId: number, scene: T.Scene): void {
		scene.add(this.createSky(wad.maps[mapId], scene))
	}

	createSky({linedefs, sky}: DoomMap, scene: T.Scene): T.Mesh {
		const minX = MF.findMinX(linedefs)
		const maxX = MF.findMaxX(linedefs)
		const minY = MF.findMinY(linedefs)
		const maxY = MF.findMaxY(linedefs)
		const sc = skyConf()

		scene.background = new T.Color(sc.color)

		const skyBox = new T.BoxGeometry(
			U.lineWidth(minX, maxX) + sc.position.width,
			sc.position.height,
			U.lineWidth(minY, maxY) + sc.position.depth)

		const material = sc.type === GC.SkyType.ORIGINAL ? skyBoxOriginalMaterial(sky.get().patches[0].bitmap) : skyBoxBitmapMaterial(sc)
		const mesh = new T.Mesh(skyBox, material)
		mesh.renderOrder = -1

		// set position to the middle of the map.
		mesh.position.set(maxX - U.lineWidth(minX, maxX) / 2, sc.position.y, -maxY + U.lineWidth(minY, maxY) / 2)
		return mesh
	}
}

const skyConf = () => GC.sky.def.find(sd => sd.name === GC.sky.active)

const COMMON_MATERIAL_PROPS: MeshStandardMaterialParameters = {side: T.BackSide, depthTest: false}

const orgBoxFactory = (map: T.DataTexture) => () => new T.MeshStandardMaterial({
	map,
	...COMMON_MATERIAL_PROPS
})

const emptyMaterial = () => new T.MeshStandardMaterial()

const skyBoxOriginalMaterial = (sky: Bitmap): T.MeshStandardMaterial[] => {
	const texture = TF.createDataTexture(sky)
	const fact = orgBoxFactory(texture)
	return [fact(), fact(), emptyMaterial(), emptyMaterial(), fact(), fact()] // ft, bk, -, -, rt, lf
}

const skyBoxBitmapMaterial = (sc): T.MeshStandardMaterial[] => boxPaths(sc.bitmap.name, sc.bitmap.ext).map(image =>
	new T.MeshStandardMaterial({map: new T.TextureLoader().load(image), ...COMMON_MATERIAL_PROPS})
)

const boxPaths = (name: string, ext: string): string[] =>
	["ft", "bk", "up", "dn", "rt", "lf"].map(side =>
		'./assets/sky/' + name + '/' + side + '.' + ext)

// ############################ EXPORTS ############################
export const testFunctions = {
	boxPaths
}
