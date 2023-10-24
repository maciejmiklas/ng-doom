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
import {Sprite, Thing} from "../wad/parser/wad-model";
import * as T from "three";
import {Log} from "../common/log";
import {SpriteThing} from "./renderer-model";
import {Either, LeftType} from "../common/either";

const CMP = "ThingService"

@Injectable({
	providedIn: 'root'
})
export class ThingService {

	constructor() {
	}

	createThings(things: Thing[], sprites: Record<string, Sprite>): SpriteThing[] {
		Log.debug(CMP, "Placing things...")
		return things.map(createSprite(sprites)).filter(sp => sp.isRight()).map(sp => sp.get())
	}
}

const createSprite = (sprites: Record<string, Sprite>) => (thing: Thing): Either<SpriteThing> => {
	const spr = sprites[thing.dir.name]
	if (spr == undefined) {
		return Either.ofLeft(() => 'Thing: ' + thing.dir.name + ' has no sprite', LeftType.WARN)
	}
	const geometry = new T.PlaneGeometry(1, 1);
	const material = new T.MeshBasicMaterial({color: 0xffff00, side: T.DoubleSide});
	const plane = new T.Mesh(geometry, material);
	return null
}

