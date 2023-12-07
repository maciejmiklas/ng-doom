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
	return texture
}

// ############################ EXPORTS ############################
export const functions = {
	createDataTexture
}
