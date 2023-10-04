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
import {Position, Thing} from "../wad/parser/wad-model";
import * as T from "three";
import {Log} from "../common/log";
import {Either} from "../common/either";
import {SpriteThing} from "./renderer-model";
import {config as GC} from "../game-config";

const CMP = "ThingService"

@Injectable({
	providedIn: 'root'
})
export class ThingService {

	constructor() {
	}

	createThings(things: Thing[], floors: T.Mesh[]): SpriteThing[] {
		Log.debug(CMP, "Placing things...")

		const findFloorHeightF = findFloorHeight(floors);
		return things.map(th => findFloorHeightF(th.position)
			.map(floorHeight => createSprite(th, floorHeight)))
			.filter(ei => ei.isRight()).map(ei => ei.get())
	}
}

const createSprite = (thing: Thing, floorHeight: number): SpriteThing => {
	return null
}

const findFloorHeight = (floors: T.Mesh[]) => (pos: Position): Either<number> => {
	const flr = GC.player.floorRay
	const rc = new T.Raycaster(new T.Vector3(pos.x, 0, pos.y), new T.Vector3(pos.x, 1, pos.y))
	const intersect = rc.intersectObjects(floors)
	if (intersect.length > 0) {
		console.log('FOUND!!!', intersect.length)
	}
	{
		console.log('?', pos.x, pos.y)
	}
	return Either.ofLeft(() => 'lleefftt');
}
