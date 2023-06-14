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
import * as T from "three";
import {config as GC} from "../game-config";
import {DoomMap, LinedefBySector, Wad} from "../wad/parser/wad-model";
import * as R from "ramda";
import {WallService} from "./wall.service";
import {FlatService} from "./flat.service";
import {BuildMapCallback} from "./callbacks";

@Injectable({
	providedIn: 'root'
})
export class WorldService implements BuildMapCallback {

	private _sectors: Sector3d

	constructor(private wallService: WallService, private flatService: FlatService) {
	}

	createScene(): T.Scene {
		const scene = new T.Scene()

		if (GC.scene.scale > 1) { // TODO - not working after: this.scene.add(this.camera)
			scene.scale.set(GC.scene.scale, GC.scene.scale, GC.scene.scale)
		}

		scene.background = new T.Color(GC.sky.color);
		scene.add(createAmbientLight())
		return scene
	}

	createWorld({linedefBySector, mapDirs}: DoomMap): Sector3d {
		const startTime = performance.now()
		const sectors: Sector3d[] = linedefBySector.map(v => this.renderSector(v))

		// Sector3d[] => ['V':Sector3d]
		const res = R.reduceBy((acc: Sector3d, el: Sector3d) => {
			acc.flats = [...acc.flats, ...el.flats]
			acc.floors = [...acc.floors, ...el.floors]
			return acc
		}, {flats: [], floors: []}, () => 'V', sectors)

		console.log('>TIME createWorld>', mapDirs[0].name, '=', performance.now() - startTime, 'ms')
		return res['V']
	}

	renderSector(lbs: LinedefBySector): Sector3d {
		// wall
		let flats = this.wallService.renderWalls(lbs)

		// floor
		const floors = this.flatService.renderFlat(lbs.flat, lbs.sector.floorTexture, lbs.sector.floorHeight, true, 'Floor')
		flats = [...flats, ...floors]

		// celling
		const celling = this.flatService.renderFlat(lbs.flat, lbs.sector.cellingTexture, lbs.sector.cellingHeight, false, 'Celling');
		flats = [...flats, ...celling]

		return {flats, floors};
	}

	buildMap(wad: Wad, map: DoomMap, scene: T.Scene): void {
		this._sectors = this.createWorld(map)
		this._sectors.flats.forEach(fl => scene.add(fl))
	}

	get sectors(): Sector3d {
		return this._sectors;
	}
}

type Sector3d = {
	flats: T.Mesh[],
	floors: T.Mesh[]
}

const createAmbientLight = () =>
	new T.AmbientLight(GC.scene.ambientLight.color, GC.scene.ambientLight.intensity);





