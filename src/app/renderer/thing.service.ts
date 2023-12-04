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
import {Sprite, Thing} from "../wad/parser/wad-model"
import * as T from "three"
import {WebGLRenderer} from "three"
import {Log} from "../common/log"
import {Either, LeftType} from "../common/either"
import {functions as TF} from "./texture-factory"
import {Scene} from "three/src/scenes/Scene";
import {Camera} from "three/src/cameras/Camera";
import {BufferGeometry} from "three/src/core/BufferGeometry";
import {Material} from "three/src/materials/Material";
import {Group} from "three/src/objects/Group";

const CMP = "ThingService"

@Injectable({
	providedIn: 'root'
})
export class ThingService {

	constructor() {
	}

	createThings(things: Thing[], sprites: Record<string, Sprite>): T.Mesh[] {
		Log.debug(CMP, "Placing things...")
		return things.map(createSprite(sprites)).filter(sp => sp.filter()).map(sp => sp.get())
	}

}

const createSprite = (sprites: Record<string, Sprite>) => (thing: Thing): Either<T.Mesh> => {
	if (thing.type.sprite === undefined) {
		return Either.ofLeft(() => 'Thing: ' + thing.dir.name + ' has no sprite')
	}
	const sprite = sprites[thing.type.sprite]
	if (sprite == undefined) {
		return Either.ofLeft(() => 'Thing: ' + thing.dir.name + ' has no sprite', LeftType.WARN)
	}

	const textures = Object.values(sprite.frames)[0].map(fr => TF.createDataTexture(fr.bitmap))
	const material = new T.MeshBasicMaterial({color: 0xffff00, side: T.DoubleSide, map: textures[0], transparent: true})

	const geometry = new T.PlaneGeometry(sprite.maxWidth, sprite.maxHeight)
	const mesh = new T.Mesh(geometry, material)
	mesh.position.set(thing.position.x, thing.sector.floorHeight + sprite.maxHeight / 2, -thing.position.y)
	mesh.castShadow = true

	const userData: ThingUserData = {
		textures,
		frameIdx: 0,
		frameMs: Date.now(),
		sprite
	}
	mesh.userData = userData

	mesh.onBeforeRender = (renderer: WebGLRenderer, scene: Scene, camera: Camera, geometry: BufferGeometry, material: Material, group: Group) => {
		const userData = mesh.userData as ThingUserData

		// rotate towards camera
		mesh.rotation.y = Math.atan2((camera.position.x - mesh.position.x), (camera.position.z - mesh.position.z));
		// next frame
		const delta = Date.now() - userData.frameMs
		if (userData.textures.length == 0 || delta < 300) {
			return
		}
		userData.frameIdx++
		if (userData.frameIdx >= userData.textures.length) {
			userData.frameIdx = 0
		}
		const sm = mesh.material as T.MeshBasicMaterial
		sm.map = userData.textures[userData.frameIdx]

		// update render time
		userData.frameMs = Date.now()
	}

	return Either.ofRight(mesh)
}

type ThingUserData = {
	textures: T.DataTexture[],
	frameIdx: number,
	frameMs: number
	sprite: Sprite
}
