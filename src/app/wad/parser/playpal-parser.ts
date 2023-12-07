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
import {Directories, Directory, Palette, Playpal, RGBA} from './wad-model'
import * as R from 'ramda'
import {functions as DP} from './directory-parser'
import {Either} from "../../common/either"

const RBG_BYTES = 3
const PLAYPAL_COLORS = 256
const PLAYPAL_BYTES = RBG_BYTES * 256
const RBG_A = 255

/**
 * @see https://doomwiki.org/wiki/COLORMAP
 * @see https://doomwiki.org/wiki/PLAYPAL
 */
const parseRBG = (bytes: number[]) => (idx: number): RGBA => {
	return {
		r: bytes[idx],
		g: bytes[idx + 1],
		b: bytes[idx + 2],
		a: RBG_A
	}
}

const parsePalette = (paletteBytes: number[], dir: Directory) => (paletteNumber: number): Palette => {
	const parseRBGBytes = parseRBG(paletteBytes)
	const bytesOffset = dir.filepos + paletteNumber * PLAYPAL_BYTES
	const colors = R.range(0, PLAYPAL_COLORS).map(idx => parseRBGBytes(bytesOffset + idx * 3))
	return {colors, idx: paletteNumber}
}

const parsePlaypal = (wadBytes: number[], dirs: Directory[]): Either<Playpal> => {
	return DP.findDirectoryByName(dirs)(Directories.PLAYPAL).map(dir => {
		const paletteParser = parsePalette(wadBytes, dir)
		const palettes = R.range(0, 13).map(paletteParser)
		return {dir, palettes}
	})
}

// ############################ EXPORTS ############################
export const testFunctions = {
	parsePalette,
	parseRBG,
}
export const functions = {
	parsePlaypal,
}
