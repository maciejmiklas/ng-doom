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
import {DoomTexture, Linedef, LinedefBySector, LinedefFlag, Sector, SpecialType} from "../wad/parser/wad-model";
import * as T from "three";
import {WebGLRenderer} from "three";
import {functions as TF} from "./texture-factory";
import {Either} from "../common/either";
import {config as GC} from "../game-config";
import {RenderCallback} from "./callbacks";
import {DataTexture} from "three/src/textures/DataTexture";
import {Scene} from "three/src/scenes/Scene";
import {Camera} from "three/src/cameras/Camera";
import {BufferGeometry} from "three/src/core/BufferGeometry";
import {Material} from "three/src/materials/Material";
import {Group} from "three/src/objects/Group";

// https://doomwiki.org/wiki/Texture_alignment
// https://doomwiki.org/wiki/Sidedef
// https://doomwiki.org/wiki/Linedef_type#Table_of_all_types

@Injectable({
	providedIn: 'root'
})
export class WallService implements RenderCallback {

	private lastRenderDeltaMs = 0

	renderWalls({sector, linedefs}: LinedefBySector): T.Mesh[] {
		const middleWall = linedefs.map(renderMiddleWall(sector))
			.filter(m => m.filter())
			.map(m => m.get())

		const upperWall = linedefs.map(renderUpperWall(sector))
			.filter(m => m.filter())
			.map(m => m.get())

		const lowerWall = linedefs.map(renderLowerWall(sector))
			.filter(m => m.filter())
			.map(m => m.get())

		const mesh: T.Mesh[] = [...middleWall, ...upperWall, ...lowerWall]
		this.setupScrollingWalls(mesh);
		return mesh
	}

	setupScrollingWalls(meshes: T.Mesh[]): void {
		meshes.filter(m => m.userData.ld.specialType == SpecialType.SCROLLING_WALL_LEFT.valueOf())
			.forEach(mesh =>
				mesh.onBeforeRender = (renderer: WebGLRenderer, scene: Scene, camera: Camera, geometry: BufferGeometry, material: Material, group: Group) => {
					const sm = mesh.material as T.MeshStandardMaterial
					const tx = sm.map as DataTexture
					tx.offset.x += this.lastRenderDeltaMs * GC.wall.texture.scroll.speedPerSec
					if (tx.offset.x > GC.wall.texture.scroll.resetAt) {
						tx.offset.x = 0;
					}
				})
	}

	onRender(deltaMs: number, renderer: WebGLRenderer): void {
		this.lastRenderDeltaMs = deltaMs
	}
}

const createWallMaterial = (dt: DoomTexture, wallWidth: number, side: T.Side, color = null): T.MeshStandardMaterial => {
	const map = TF.createDataTexture(dt);
	map.repeat.x = wallWidth / dt.width
	return new T.MeshStandardMaterial({
		map,
		transparent: true, // TODO - only some are transparent
		side,
		color
	});
}

/** front side -> upper wall */
const renderUpperWall = ({id: sid}: Sector) => (ld: Linedef): Either<T.Mesh> => {
	if (ld.backSide.isLeft()) {
		return Either.ofLeft(() => 'No upper wall for: ' + ld.id)
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

	return Either.ofRight(mesh)
}

/**
 * front side -> middle wall part.
 */
// TODO: https://doomwiki.org/wiki/Texture_alignment -> If the "lower unpegged" flag is set on the linedef, .....
const renderMiddleWall = ({id: sid}: Sector) => (ld: Linedef): Either<T.Mesh> =>
	Either.ofTruth([ld.frontSide.middleTexture],
		() => wall(() => T.DoubleSide, ld.frontSide.middleTexture.get(),
			(ld, wallHeight) => ld.sector.floorHeight + wallHeight / 2,
			(ld) => ld.sector.cellingHeight - ld.sector.floorHeight)(ld))

/** front side -> lower wall part */
const renderLowerWall = ({id: sid}: Sector) => (ld: Linedef): Either<T.Mesh> => {
	if (ld.backSide.isLeft()) {
		return Either.ofLeft(() => 'No lower wall for: ' + ld.id)
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

	const height = (lde: Linedef) => Math.abs(lde.sector.floorHeight - lde.backSide.get().sector.floorHeight)
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

	return Either.ofRight(mesh)
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
	mesh.userData = {ld: ld}
	return mesh
}
