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
import {Bitmap, Sprite, Thing} from "../wad/parser/wad-model"
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
import {imageTracer} from 'imagetracer'
import {SVGLoader} from "three/examples/jsm/loaders/SVGLoader";

const CMP = "ThingService"

@Injectable({
	providedIn: 'root'
})
export class ThingService {

	constructor() {
	}

	createThings(things: Thing[], sprites: Record<string, Sprite>): T.Object3D[] {
		Log.debug(CMP, "Placing things...")
		return things.map(createSprite(sprites)).filter(sp => sp.filter()).map(sp => sp.get())
	}
}

const createSprite = (sprites: Record<string, Sprite>) => (thing: Thing): Either<T.Object3D> => {
	if (thing.type.sprite === undefined) {
		return Either.ofLeft(() => 'Thing: ' + thing.dir.name + ' has no sprite')
	}
	const sprite = sprites[thing.type.sprite]
	if (sprite == undefined) {
		return Either.ofLeft(() => 'Thing: ' + thing.dir.name + ' has no sprite', LeftType.WARN)
	}

	const frames = Object.values(sprite.frames)[0]

	const object3D = bitmapTo3D(frames[0].bitmap);
	object3D.rotateX(Math.PI)
	object3D.position.set(thing.position.x, thing.sector.floorHeight + sprite.maxHeight, -thing.position.y)
	return Either.ofRight(object3D);
}

const bitmapTo3D = (bitmap: Bitmap): T.Object3D => {
	// https://github.com/jankovicsandras/imagetracerjs/blob/master/options.md
	const svg = imageTracer.imageDataToSVG(new ImageData(bitmap.rgba, bitmap.width, bitmap.height), 'posterized3')
	const tsvg = new SVGLoader().parse(svg)
	const group = new T.Group()
	const texture = TF.createDataTexture(bitmap)

	const colors = ['red', 'blue', 'green', 'yellow', 'pink']
	console.log('PA', tsvg.paths.length)

	if (tsvg.paths.length != 5) {
		return group
	}


	for (let i = 0; i < tsvg.paths.length; i++) {
		const path = tsvg.paths[i]
		const fillColor = path.userData.style.fill
		if (fillColor === undefined) {
			continue;
		}
		const color = new T.Color().setStyle(fillColor).convertSRGBToLinear();
		if (color.r === 0 && color.b === 0 && color.g === 0) {
			continue;
		}
		console.log('OP', path.userData.style.fillOpacity)

		const material = new T.MeshBasicMaterial({
			color: colors[i],//new T.Color().setStyle(fillColor).convertSRGBToLinear(),
			opacity: 1,
			transparent: true,
			side: T.DoubleSide,
			depthWrite: false,
			//map: texture
		})

		const shape = SVGLoader.createShapes(path)[0];
		const geometry = new T.ShapeGeometry(shape)
		const mesh = new T.Mesh(geometry, material)
		mesh.castShadow = true
		group.add(mesh)
	}
	return group
}

const createSprite_ = (sprites: Record<string, Sprite>) => (thing: Thing): Either<T.Mesh> => {
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
