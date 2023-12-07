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
		this.thingService.createThings(map.things, wad.sprites).forEach(el => scene.add(el))

		Log.info(CMP, 'Map ', map.mapName, ' created in ', performance.now() - startTime, 'ms')
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





