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
import {RgbaBitmap} from "../wad/parser/wad-model"
import * as T from "three"
import {config as GC} from "../game-config"

const createDataTexture = (bitmap: RgbaBitmap): T.DataTexture => {
	const texture = new T.DataTexture(bitmap.rgba, bitmap.width, bitmap.height)
	texture.needsUpdate = true
	texture.format = T.RGBAFormat
	texture.type = T.UnsignedByteType
	texture.magFilter = T.NearestFilter
	texture.minFilter = T.NearestFilter
	texture.mapping = T.UVMapping
	texture.wrapS = T.RepeatWrapping
	texture.wrapT = T.RepeatWrapping
	texture.anisotropy = GC.texture.anisotropy
	texture.minFilter = GC.texture.minFilter
	texture.magFilter = GC.texture.magFilter
	texture.encoding = T.sRGBEncoding
	texture.flipY = true
	return texture
}

// ############################ EXPORTS ############################
export const functions = {
	createDataTexture
}
