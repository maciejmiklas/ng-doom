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
import {DoomTexture, Linedef, LinedefBySector, LinedefFlag, Sector} from "../wad/parser/wad-model";
import * as T from "three";
import {functions as TF} from "./texture-factory";
import {Either} from "../common/either";
import {config as GC} from "../game-config";

@Injectable({
	providedIn: 'root'
})
export class WallService {

// https://doomwiki.org/wiki/Texture_alignment
// https://doomwiki.org/wiki/Sidedef
	renderWalls({sector, linedefs}: LinedefBySector): T.Mesh[] {
		let mesh: T.Mesh[] = []

		const upperWallRenderer = renderUpperWall(sector);
		const lowerWallRenderer = renderLowerWall(sector);
		// TODO render middleTexture: Middle floating textures can be used to achieve a variety of faux 3D effects such as 3D bridge
		linedefs.forEach(ld => {
			mesh = renderMiddleWall(ld).map(m => mesh.concat(m)).orElse(() => mesh)
			mesh = upperWallRenderer(ld).map(m => mesh.concat(m)).orElse(() => mesh)
			mesh = lowerWallRenderer(ld).map(m => mesh.concat(m)).orElse(() => mesh)
		})
		return mesh
	}
}

const createWallMaterial = (dt: DoomTexture, wallWidth: number, side: T.Side, color = null): T.Material => {
	const map = TF.createDataTexture(dt);
	map.repeat.x = wallWidth / dt.width
	const material = new T.MeshStandardMaterial({
		map,
		transparent: true,
		side,
		color,
	});
	return material
}

/** front side -> upper wall */
const renderUpperWall = ({id: sid}: Sector) => (ld: Linedef): Either<T.Mesh[]> => {
	if (ld.backSide.isLeft()) {
		return Either.ofLeft(() => 'No upper wall for one sided Linedef: ' + ld.id)
	}

	// when current Linedef belongs to current Sector take front-side texture, otherwise try backside as we are looking at
	// the back wall of another Sector
	const texture = Either.ofCondition(
		() => sid !== ld.sector.id,
		() => 'Backside has no upper texture on: ' + ld.id,
		() => ld.backSide.get().upperTexture).orElse(() => ld.frontSide.upperTexture)

	if (texture.isLeft()) {
		return Either.ofLeft(() => 'No texture for upper wall: ' + ld.id)
	}

	const wallHeight = (ld: Linedef) => Math.abs(ld.sector.cellingHeight - ld.backSide.get().sector.cellingHeight)
	const mesh = ld.flags.has(LinedefFlag.UPPER_TEXTURE_UNPEGGED) ?
		// the upper texture will begin at the higher ceiling and be drawn downwards.
		wall(() => T.DoubleSide, texture.get(),
			(ld, wallHeight) => Math.max(ld.sector.cellingHeight, ld.backSide.get().sector.cellingHeight) - wallHeight / 2,
			wallHeight)(ld)
		:
		// the upper texture is pegged to the lowest ceiling
		wall(() => T.DoubleSide, texture.get(),
			(ld, wallHeight) => Math.min(ld.sector.cellingHeight, ld.backSide.get().sector.cellingHeight) + wallHeight / 2,
			wallHeight)(ld)

	return Either.ofRight([mesh])
}

/**
 * front side -> middle wall part.
 *
 * The top of the texture is at the ceiling, the texture continues downward to the floor.
 */
const renderMiddleWall = (ld: Linedef): Either<T.Mesh[]> => {
	return Either.ofTruth([ld.frontSide.middleTexture],
		() => [wall(() => T.DoubleSide, ld.frontSide.middleTexture.get(),
			(ld, wallHeight) => ld.sector.floorHeight + wallHeight / 2,
			(ld) => ld.sector.cellingHeight - ld.sector.floorHeight)(ld)])
}

/** front side -> lower wall part */
const renderLowerWall = ({id: sid}: Sector) => (ld: Linedef): Either<T.Mesh[]> => {
	if (ld.backSide.isLeft()) {
		return Either.ofLeft(() => 'No lower wall for single sided Linedef: ' + ld.id)
	}

	// when current Linedef belongs to current Sector take front-side texture, otherwise try backside as we are looking at
	// the back wall of another Sector
	const texture = Either.ofCondition(
		() => sid !== ld.sector.id,
		() => 'Backside has no lower texture on: ' + ld.id,
		() => ld.backSide.get().lowerTexture).orElse(() => ld.frontSide.lowerTexture)

	if (texture.isLeft()) {
		return Either.ofLeft(() => 'No texture for lower wall: ' + ld.id)
	}

	const height = (lde) => Math.abs(lde.sector.floorHeight - lde.backSide.val.sector.floorHeight)
	const mesh = ld.flags.has(LinedefFlag.LOWER_TEXTURE_UNPEGGED) ?
		// the upper texture is pegged to the highest flor
		wall(() => T.DoubleSide, texture.get(),
			(ld, wallHeight) => Math.max(ld.sector.floorHeight, ld.backSide.get().sector.floorHeight) - wallHeight / 2,
			height)(ld)
		:
		// the upper texture is pegged to the lowest flor
		wall(() => T.DoubleSide, texture.get(),
			(ld, wallHeight) => Math.min(ld.sector.floorHeight, ld.backSide.get().sector.floorHeight) + wallHeight / 2,
			height)(ld)

	return Either.ofRight([mesh])
}

const wall = (sideF: (ld: Linedef) => T.Side,
							texture: DoomTexture,
							wallOffsetFunc: (ld: Linedef, wallHeight: number) => number,
							wallHeightFunc: (ld: Linedef) => number) => (ld: Linedef, color = null): T.Mesh => {
	const wallHeight = wallHeightFunc(ld)
	const vs = ld.start
	const ve = ld.end
	const wallWidth = Math.hypot(ve.x - vs.x, ve.y - vs.y)
	const material = createWallMaterial(texture, wallWidth, sideF(ld), color)

	const mesh = new T.Mesh(new T.PlaneGeometry(wallWidth, wallHeight), material)
	mesh.position.set((vs.x + ve.x) / 2, wallOffsetFunc(ld, wallHeight), -(vs.y + ve.y) / 2)
	mesh.rotateY(Math.atan2(ve.y - vs.y, ve.x - vs.x))
	mesh.receiveShadow = GC.wall.shadow.receive
	mesh.castShadow = GC.wall.shadow.cast
	return mesh
}
