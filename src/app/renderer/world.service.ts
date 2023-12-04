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
import * as T from "three"
import {config as GC} from "../game-config"
import {FlatBySector, Wad} from "../wad/parser/wad-model"
import {WallService} from "./wall.service"
import {FlatService} from "./flat.service"
import {BuildMapCallback} from "./callbacks"
import * as R from 'ramda'
import {ThingService} from "./thing.service"
import {Log} from "../common/log"
import {Either, LeftType} from "../common/either"
import {Sector3d} from "./renderer-model"

const CMP = "WorldService"

@Injectable({
	providedIn: 'root'
})
export class WorldService implements BuildMapCallback {
	private _sectors: Sector3d[]
	private _floors: T.Mesh[]

	constructor(private wallService: WallService, private flatService: FlatService, private thingService: ThingService) {
	}

	createScene(): T.Scene {
		const scene = new T.Scene()

		if (GC.scene.scale > 1) { // TODO - not working after: this.scene.add(this.camera)
			scene.scale.set(GC.scene.scale, GC.scene.scale, GC.scene.scale)
		}

		scene.add(createAmbientLight())
		return scene
	}

	buildMap(wad: Wad, mapId: number, scene: T.Scene): void {
		const startTime = performance.now()
		this._sectors = this.createWorld(wad, mapId)
		this._sectors.forEach(sc => {
			sc.walls.forEach(wl => scene.add(wl))
			scene.add(sc.floor)
			sc.ceiling.exec(fl => scene.add(fl))
		})

		this._floors = R.flatten(this._sectors.map(s => s.floor))

		// sprite and things
		const map = wad.maps[mapId]
		this.thingService.createThings(map.things, wad.sprites).forEach(mesh => scene.add(mesh))
		Log.info(CMP, 'Map ', map.mapDirs[0].name, ' created in ', performance.now() - startTime, 'ms')
	}

	private createWorld(wad: Wad, mapId: number): Sector3d[] {
		const map = wad.maps[mapId]
		const sectors: Sector3d[] = map.flatBySector.map(v => this.renderSector(v))
			.filter(s => s.filter()).map(s => s.get())
		return sectors
	}

	private renderSector(lbs: FlatBySector): Either<Sector3d> {
		Log.info(CMP, "Rendering sector ", lbs.sector.id)

		// wall
		const walls = this.wallService.renderWalls(lbs)

		// floor
		const floor = this.flatService.renderFlat(lbs.flat, lbs.sector.floorTexture,
			lbs.sector.floorHeight, true, 'Floor')

		if (floor.isLeft()) {
			return Either.ofLeft(() => 'Sector ' + lbs.sector.id + ' without floor!', LeftType.WARN)
		}

		// ceiling
		const ceiling = this.flatService.renderFlat(lbs.flat, lbs.sector.cellingTexture,
			lbs.sector.cellingHeight, false, 'Celling')

		return Either.ofRight({sectorId: lbs.sector.id, walls, floor: floor.get(), ceiling})
	}

	get sectors(): Sector3d[] {
		return this._sectors
	}

	get floors(): T.Mesh[] {
		return this._floors
	}
}

const createAmbientLight = () =>
	new T.AmbientLight(GC.scene.ambientLight.color, GC.scene.ambientLight.intensity)





