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
import {Either, LeftType} from '../../common/either'
import {Bitmap, BitmapHeader, Column, Directory, Palette, Post, RGBA, RgbaBitmap} from './wad-model'
import U from '../../common/util'
import * as R from 'ramda'

const POST_PADDING_BYTES = 4
const LAST_POST_MARKER = 0XFF
const CMP = 'BPA'
const TRANSPARENT_RGBA_PIXEL = -1
const TRANSPARENT_RGBA: RGBA = {
	r: 0,
	b: 0,
	g: 0,
	a: 0
}
const RGBA_BYTES = 4
const COLUMNOFS_BYTES = 4

const MAX_POST_LENGTH = 5000
const MAX_BITMAP_WIDTH = 640
const MAX_BITMAP_HEIGHT = 480
const FLAT_WIDTH = 64
const FLAT_HEIGHT = 64

/*
 * @see https://doomwiki.org/wiki/Picture_format
 * @see https://www.cyotek.com/blog/decoding-doom-picture-files
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ImageData/ImageData
 * https://doomwiki.org/wiki/Flat
 */

const parsePost = (wadBytes: number[]) => (filepos: number): Either<Post> => {
	const ubyteParser = U.parseUint8(wadBytes)
	const topdelta = ubyteParser(filepos)
	const length = ubyteParser(filepos + 1, MAX_POST_LENGTH)
	return Either.ofCondition(() => topdelta !== LAST_POST_MARKER, () => 'End of column', () =>
		({
			topdelta,
			filepos,
			data: R.unfold((idx) => idx === length ? false : [ubyteParser(filepos + idx + 3), idx + 1], 0)
		}))
}

const parseColumn = (wadBytes: number[], dir: Directory) => (filepos: number): Either<Column> => {
	const postParser = parsePost(wadBytes)
	return Either.until<Post>(
		p => postParser(p.filepos + p.data.length + POST_PADDING_BYTES), // p here is the previous post
		postParser(filepos), () => dir.name + ' has Empty Column at: ' + filepos).map(posts => ({posts}))
}

const parsePatchHeader = (wadBytes: number[]) => (dir: Directory): BitmapHeader => {
	const uint16Parser = U.parseUint16(wadBytes)
	const int16Parser = U.parseInt16(wadBytes)
	const uintParser = U.parseUint32(wadBytes)
	const filepos = dir.filepos
	const width = uint16Parser(filepos, MAX_BITMAP_WIDTH)
	return {
		dir,
		width,
		height: uint16Parser(filepos + 0x02, MAX_BITMAP_HEIGHT),
		xOffset: int16Parser(filepos + 0x04),
		yOffset: int16Parser(filepos + 0x06),
		columnofs: unfoldColumnofs(filepos + 8, width).map((offset) => filepos + uintParser(offset))
	}
}

const unfoldColumnofs = (filepos: number, width: number): number[] =>
	R.unfold((idx) => idx === width ? false : [filepos + idx * COLUMNOFS_BYTES, idx + 1], 0)

const parseBitmap = (wadBytes: number[], palette: Palette) => (dir: Directory): Either<Bitmap> => {
	const header = parsePatchHeader(wadBytes)(dir)
	const columnParser = parseColumn(wadBytes, dir)
	const columns: Either<Column>[] = header.columnofs.map(colOfs => columnParser(colOfs))
	const nonEmptyCols = columns.filter(c => c.filter())
	const rgba = patchDataToRGBA(columns, header.width, header.height, palette)
	return Either.ofCondition(
		() => columns.length === header.width && nonEmptyCols.length > 0 && header.width > 0 && header.height > 0,
		() => 'Faulty Bitmap on: Dir' + JSON.stringify(dir) + ', Header: ' + JSON.stringify(header) + ', Cols:' + nonEmptyCols.length,
		() => ({
			palette,
			header,
			columns,
			rgba,
			width: header.width,
			height: header.height,
			name: header.dir.name
		}), LeftType.WARN)
}

const unfoldFlatColFilePos = (filepos: number): number[] =>
	R.unfold((idx) => idx === FLAT_WIDTH ? false : [filepos + idx * FLAT_WIDTH, idx + 1], 0)

const unfoldFlatColumn = (wadBytes: number[]) => (filepos: number): Either<Column> => {
	const uint8Parser = U.parseUint8(wadBytes)
	const posts: Post[] = [{
		topdelta: 0,
		data: R.unfold((idx) => idx === FLAT_HEIGHT ? false : [uint8Parser(filepos + idx), idx + 1], 0),
		filepos
	}]
	return Either.ofRight({posts})
}

/**
 * A flat is an image that is drawn on the floors and ceilings of sectors. Flats are very different from wall textures.
 * Flats are a raw collection of pixel values with no offset or other dimension information; each flat is a named lump
 * of 4096 bytes representing a 64×64 square. The pixel values are converted to actual colors in the same way as for
 * the Doom picture format, using the color map.
 *
 * @see https://doomwiki.org/wiki/Flat
 */
const parseFlat = (wadBytes: number[], palette: Palette) => (dir: Directory): Either<RgbaBitmap> => {
	const flatColumn = unfoldFlatColumn(wadBytes)
	const columns = unfoldFlatColFilePos(dir.filepos).map(flatColumn)
	const rgba = patchDataToRGBA(columns, FLAT_WIDTH, FLAT_HEIGHT, palette)
	return Either.ofRight(
		{
			rgba,
			width: FLAT_WIDTH,
			height: FLAT_HEIGHT,
			name: dir.name
		})
}

/**
 * Difference between DOOM Patch bitmap and Image on Canvas
 <table style="width:100%">
  <tr>
    <th></th>
    <th>DOOM Patch</th>
    <th>Image on Canvas</th>
  </tr>
  <tr>
    <td>pixel</td>
    <td>one byte</td>
    <td>4 bytes</td>
  </tr>
  <tr>
    <td>orientation</td>
    <td>columns</td>
    <td>rows</td>
  </tr>
</table>
 */
const patchDataToRGBA = (columns: Either<Column>[], width: number, height: number, palette: Palette): Uint8ClampedArray => {
	const pixAtCol = postPixelAt(columns)
	const array = new Uint8ClampedArray(width * height * RGBA_BYTES)
	const pixelToImg = pixelToImgBuf(array, palette)
	let idx = 0
	U.itn(0, height, (y) => {
		U.itn(0, width, (x) => {
			idx = pixelToImg(idx, pixAtCol(x, y))
		})
	})
	return array
}

const postAt = (columns: Either<Column>[]) => (x: number, y: number): Either<Post> =>
	columns[x].map(c => Either.ofNullable(R.find<Post>(p => y >= p.topdelta && y < p.topdelta + p.data.length)(c.posts),
		() => 'Transparent pixel at (' + x + ',' + y + ')'))

const postPixelAt = (columns: Either<Column>[]) => (x: number, y: number): number => {
	return postAt(columns)(x, y)
		.assert(p => p.data.length > y - p.topdelta,
			p => () => 'Pixel out of range at:(' + x + ',' + y + ')->' + p.data.length + '<=' + y + '-' + p.topdelta)
		.map(p => p.data[y - p.topdelta])
		.assert(p => p >= 0 && p <= 255,
			p => () => 'Pixel out of range:(' + x + ',' + y + ') = ' + p)
		.orElse(() => TRANSPARENT_RGBA_PIXEL)
}

const changePalette = (palette: Palette) => (bitmap: Bitmap): Bitmap =>
	({
		...bitmap,
		rgba: patchDataToRGBA(bitmap.columns, bitmap.header.width, bitmap.header.height, palette)
	})

const pixelToImgBuf = (img: Uint8ClampedArray, palette: Palette) => (idx: number, pixel: number): number => {
	const rgb = pixel === -1 ? TRANSPARENT_RGBA : palette.colors[pixel]
	img[idx++] = rgb.r
	img[idx++] = rgb.g
	img[idx++] = rgb.b
	img[idx++] = rgb.a
	return idx
}

// ############################ EXPORTS ############################
export const testFunctions = {
	parsePost,
	parseColumn,
	unfoldColumnofs,
	parsePatchHeader,
	postPixelAt,
	patchDataToRGBA,
	postAt
}
export const functions = {
	parseBitmap,
	parseFlat,
	changePalette
}
