/*
 *  Copyright 2002-2019 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
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
import {Either} from '@maciejmiklas/functional-ts';
import {Bitmap, BitmapHeader, Column, Directory, Palette, Post, RGBA} from './wad-model';
import U from '../../common/util';
import * as R from 'ramda';
import {Log} from '../../common/log';

const POST_PADDING_BYTES = 4;
const LAST_POST_MARKER = 0XFF;
const CMP = 'BPA';
const TRANSPARENT_RGBA_PIXEL = -1;
const TRANSPARENT_RGBA: RGBA = {
	r: 0,
	b: 0,
	g: 0,
	a: 0
};
const RGBA_BYTES = 4;

/*
 * @see https://doomwiki.org/wiki/Picture_format
 * @see https://www.cyotek.com/blog/decoding-doom-picture-files
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ImageData/ImageData
 */

const parsePost = (wadBytes: number[]) => (filepos: number): Either<Post> => {
	const ubyteParser = U.parseUbyte(wadBytes);
	const topdelta = ubyteParser(filepos);
	const length = ubyteParser(filepos + 1);
	return Either.ofCondition(() => topdelta !== LAST_POST_MARKER, () => 'End of column', () =>
		({
			topdelta,
			filepos,
			data: R.unfold((idx) => idx === length ? false : [ubyteParser(filepos + idx + 3), idx + 1], 0)
		}));
};

const parseColumn = (wadBytes: number[], dir: Directory) => (filepos: number): Either<Column> => {
	const postParser = parsePost(wadBytes);
	return Either.until<Post>(
		p => postParser(p.filepos + p.data.length + POST_PADDING_BYTES), // p here is the previous post
		postParser(filepos), () => dir.name + ' has Empty Column at: ' + filepos).map(posts => ({posts}));
};

const parsePatchHeader = (wadBytes: number[]) => (dir: Directory): BitmapHeader => {
	const shortParser = U.parseShort(wadBytes);
	const uintParser = U.parseUint(wadBytes);
	const filepos = dir.filepos;
	const width = shortParser(filepos);
	return {
		dir,
		width,
		height: shortParser(filepos + 0x02),
		xOffset: shortParser(filepos + 0x04),
		yOffset: shortParser(filepos + 0x06),
		columnofs: unfoldColumnofs(filepos + 8, width).map((offset) => filepos + uintParser(offset))
	};
};

const unfoldColumnofs = (filepos: number, width: number): number[] =>
	R.unfold((idx) => idx === width ? false : [filepos + idx * RGBA_BYTES, idx + 1], 0);

const parseBitmap = (wadBytes: number[], palette: Palette) => (dir: Directory): Either<Bitmap> => {
	Log.debug(CMP, 'Parse Bitmap:', dir);
	const header = parsePatchHeader(wadBytes)(dir);
	const columnParser = parseColumn(wadBytes, dir);
	const columns: Either<Column>[] = header.columnofs.map(colOfs => columnParser(colOfs));
	const rgba = patchDataToRGBA(columns, header.width, header.height, palette);
	return Either.ofCondition(
		() => columns.length === header.width,
		() => 'Some columns (' + columns.length + '/' + header.width + ') are missing in Picture : ' + dir.name + ' at ' + dir.filepos,
		() => ({
			header,
			columns,
			rgba,
			width: header.width,
			height: header.height,
			name: header.dir.name
		}));
};

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
	const pixAtCol = postPixelAt(columns);
	const array = new Uint8ClampedArray(width * height * RGBA_BYTES);
	const pixelToImg = pixelToImgBuf(array, palette);
	let idx = 0;
	U.itn(0, height, (y) => {
		U.itn(0, width, (x) => {
			idx = pixelToImg(idx, pixAtCol(x, y));
		});
	});
	return array;
};

const postAt = (columns: Either<Column>[]) => (x: number, y: number): Either<Post> =>
	columns[x].map(c => Either.ofNullable(R.find<Post>(p => y >= p.topdelta && y < p.topdelta + p.data.length)(c.posts),
		() => 'Transparent pixel at (' + x + ',' + y + ')'));

const postPixelAt = (columns: Either<Column>[]) => (x: number, y: number): number => {
	return postAt(columns)(x, y)
		.assert(p => Either.ofCondition(() => p.data.length > y - p.topdelta,
			() => 'Pixel out of range at:(' + x + ',' + y + ')->' + p.data.length + '<=' + y + '-' + p.topdelta, () => 'OK'))
		.map(p => p.data[y - p.topdelta]).orElseGet(() => TRANSPARENT_RGBA_PIXEL);
};

const patchToRGBA = (bitmap: Bitmap) => (palette: Palette): Uint8ClampedArray =>
	patchDataToRGBA(bitmap.columns, bitmap.header.width, bitmap.header.height, palette);

const pixelToImgBuf = (img: Uint8ClampedArray, palette: Palette) => (idx: number, pixel: number): number => {
	const rgb = pixel === -1 ? TRANSPARENT_RGBA : palette.colors[pixel];
	img[idx++] = rgb.r;
	img[idx++] = rgb.g;
	img[idx++] = rgb.b;
	img[idx++] = rgb.a;
	return idx;
};


// ############################ EXPORTS ############################
export const testFunctions = {
	parsePost,
	parseColumn,
	unfoldColumnofs,
	parsePatchHeader,
	postPixelAt,
	patchToRGBA,
	patchDataToRGBA,
	postAt
};
export const functions = {
	parseBitmap
};
