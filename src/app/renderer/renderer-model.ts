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

import * as T from "three"
import {Either} from "../common/either"
import {Sector, Sprite, Thing} from "../wad/parser/wad-model"

export type Sector3d = {
	sectorId: number,
	walls: T.Mesh[],
	floor: T.Mesh,
	ceiling: Either<T.Mesh>
}

export type SpriteThing = {
	thing: Thing,
	sprite: Sprite,
	mesh: T.Mesh
}
