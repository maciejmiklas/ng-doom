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
import * as R from 'ramda'
import {Bitmap, Directories, Directory, DoomTexture, Palette, Patch, Pnames, RgbaBitmap} from './wad-model'
import U from '../../common/util'
import {functions as DP} from './directory-parser'
import {functions as BP} from './bitmap-parser'
import {Either, LeftType} from '../../common/either'

const RGBA_BYTES = 4

const parsePnames = (wadBytes: number[], dirs: Directory[]): Either<Pnames> => {
	return DP.findDirectoryByName(dirs)(Directories.PNAMES).map(dir => {
		const nummappatches = U.parseInt32(wadBytes)(dir.filepos)
		const strParser = U.parseStr(wadBytes)
		const names: string[] = R
			.range(0, nummappatches) // ()=> Patches amount
			.map(idx => strParser(dir.filepos + 0x04 + 8 * idx, 8).toUpperCase()) // (patch offset)=> patch names
		return {dir, nummappatches, names}
	})
}

const findPatchDir = (dirs: Directory[]) => (patchName: string): Either<Directory> =>
	DP.findDirectoryByName(dirs)(patchName)

const parsePatches = (wadBytes: number[], dirs: Directory[], palette: Palette, pnames: Pnames): Either<Bitmap[]> => {
	const patchDirFinder = findPatchDir(dirs)
	const bitmapParser = BP.parseBitmap(wadBytes, palette)
	const patches = pnames.names
		.map(patchDirFinder) // (dirName)=> Either<Directory>
		.filter(d => d.filter()).map(d => d.get()) // (Either<Directory>)=>Directory
		.map(bitmapParser).filter(b => b.filter()).map(b => b.get()) // (Directory) => Bitmap

	return Either.ofCondition(() => patches.length > 0, () => 'No patches', () => patches)
}

const parsePatch = (wadBytes: number[], dirs: Directory[], pnames: Pnames, patches: Bitmap[]) => (offset: number): Either<Patch> => {
	const shortParser = U.parseInt16(wadBytes)
	const patchIdx = shortParser(offset + 0x04)
	const patchName = Either.ofCondition(
		() => patchIdx < pnames.names.length,
		() => 'patchIdx (' + patchIdx + ') out of bound (' + pnames.names.length + ') at:' + offset,
		() => pnames.names[patchIdx], LeftType.WARN)

	const bitmap = patchName.map(pn => patches.find(p => p.header.dir.name === pn))
	return Either.ofTruth([patchName, bitmap], () => ({
		originX: shortParser(offset),
		originY: shortParser(offset + 0x02),
		patchIdx,
		patchName: patchName.get(),
		bitmap: bitmap.get()
	}))
}

const highlightPatch = (texture: DoomTexture, highlighter: (path: Patch) => Either<Palette>): Uint8ClampedArray => {
	const patches = texture.patches.map(patch => highlighter(patch) // go on, if Palette should be changed for this patch
		.map(palette => BP.changePalette(palette)(patch.bitmap)) // generate new bitmap with given palette for this patch
		.map(bitmap => ({ // clone this patch and apply new bitmap with changed palette
			...patch,
			bitmap
		})).orElse(() => patch) // return the original patch if the palette was not changed
	)
	return createTextureRgba(texture.width, texture.height, patches)
}

const parseTexture = (wadBytes: number[], dirs: Directory[], dir: Directory, pnames: Pnames, allPatches: Bitmap[]) => (offset: number): Either<DoomTexture> => {
	const strParser = U.parseStr(wadBytes)
	const shortParser = U.parseInt16(wadBytes)
	const patchCountWad = shortParser(offset + 0x14)
	const patchParser = parsePatch(wadBytes, dirs, pnames, allPatches)
	const patches = R
		.range(0, patchCountWad)// ()=> patches amount
		.map(pn => offset + 22 + pn * 10)//(patch number) => patch offset
		.map(offset => patchParser(offset))// (patch offset)=> Either<Patch>
		.filter(e => e.filter())// remove Left
		.map(e => e.get()) // (Either<Patch>) => Patch
	const width = shortParser(offset + 0x0C)
	const height = shortParser(offset + 0x0E)

	return Either.ofCondition(() => patchCountWad === patches.length,
		() => 'Incorrect Patches amount for Texture from ' + dir + ', found: ' + patches.length,
		() => ({
			dir,
			name: strParser(offset, 8),
			width,
			height,
			patchCount: patches.length,
			patches,
			rgba: createTextureRgba(width, height, patches)
		}), LeftType.WARN)
}

const parseTextures = (wadBytes: number[], dirs: Directory[], pnames: Pnames, patches: Bitmap[]): Either<DoomTexture[]> => {
	const textures: DoomTexture[] = []
	const parser = parseTextureByDir(wadBytes, dirs, pnames, patches)
	parser(Directories.TEXTURE1).exec(tx => textures.push(...tx))
	parser(Directories.TEXTURE2).exec(tx => textures.push(...tx))
	return Either.ofCondition(() => textures.length > 0, () => 'No textures at all!', () => textures, LeftType.WARN)
}

const parseTextureByDir = (wadBytes: number[], dirs: Directory[], pnames: Pnames, patches: Bitmap[]) => (td: Directories): Either<DoomTexture[]> =>
	DP.findDirectoryByName(dirs)(td).map(dir => {
		const intParser = U.parseInt32(wadBytes)
		const textureParser = parseTexture(wadBytes, dirs, dir, pnames, patches)
		const offset = dir.filepos
		const textures: DoomTexture[] = R
			.range(0, intParser(offset))// ()=> Textures amount (numtextures)
			.map(idx => offset + intParser(offset + 0x04 + idx * 4))// ()=> offsets to Textures
			.map(offset => textureParser(offset))// ()=> Either<DoomTexture>
			.filter(dt => dt.filter())
			.map(dt => dt.get())
		return Either.ofCondition(() => textures.length > 0, () => 'No textures found', () => textures, LeftType.WARN)
	})

const findFlatDirs = (dirs: Directory[]): Either<Directory[]> =>
	DP.findBetween(dirs)(Directories.F_START, Directories.F_END)((d) => !d.name.includes('_START') && !d.name.includes('_END'))

const parseFlats = (wadBytes: number[], dirs: Directory[], palette: Palette): Either<Bitmap[]> => {
	const flatParser = BP.parseFlat(wadBytes, palette)
	return findFlatDirs(dirs)
		.map(dirs => dirs.map(d => flatParser(d)))// Either<Directory> => Either[]<Either<Bitmap[]>>
		.map(e => e.filter(d => d.filter()) // remove Left
			.map(d => d.get())) // Either[]<Either<Bitmap[]>> => Either<Bitmap[]>
}

const toImageData = (bitmap: RgbaBitmap): ImageData => {
	return new ImageData(bitmap.rgba, bitmap.width, bitmap.height)
}

const toImageBitmap = (bitmap: Bitmap) => (width: number, height: number): Promise<ImageBitmap> => {
	return createImageBitmap(toImageData(bitmap), {resizeWidth: width, resizeHeight: height})
}

const createTextureRgba = (width: number, height: number, patches: Patch[]): Uint8ClampedArray => {
	const rgba = new Uint8ClampedArray(width * height * RGBA_BYTES)
	const patcher = applyPatch(width, height, rgba)
	patches.forEach(patcher)
	return rgba
}

const rgbaPixelOffset = (width: number) => (x: number, y: number): number => (x + y * width) * RGBA_BYTES

const copyRgbaPixel = (fromImg: Uint8ClampedArray, fromOffset: number) => (toImg: Uint8ClampedArray, toOffset: number) =>
	R.range(0, 4).map(idx => toImg[idx + toOffset] = fromImg[idx + fromOffset])

const applyPatch = (width: number, height: number, to: Uint8ClampedArray) => (from: Patch) => {
	const fromXInit = Math.abs(Math.min(from.originX, 0))
	const fromYInit = Math.abs(Math.min(from.originY, 0))

	const toXInit = Math.max(from.originX, 0)
	const toYInit = Math.max(from.originY, 0)

	const fromXMax = from.bitmap.header.width
	const fromYMax = from.bitmap.header.height

	const rgbaPixelOffsetFrom = rgbaPixelOffset(from.bitmap.width)
	const rgbaPixelOffsetTo = rgbaPixelOffset(width)

	// TODO not functional - see U.itn
	for (let fromY = fromYInit, toY = toYInit; fromY < fromYMax && toY < height; fromY++, toY++) {
		for (let fromX = fromXInit, toX = toXInit; fromX < fromXMax && toX < width; fromX++, toX++) {
			copyRgbaPixel(from.bitmap.rgba, rgbaPixelOffsetFrom(fromX, fromY))(to, rgbaPixelOffsetTo(toX, toY))
		}
	}
}

// ############################ EXPORTS ############################
export const testFunctions = {
	findPatchDir,
	toImageData,
	parseTextureByDir,
	findFlatDirs
}

export const functions = {
	parseTextures,
	parsePatches,
	parsePnames,
	toImageBitmap,
	toImageData,
	parseFlats,
	highlightPatch
}
