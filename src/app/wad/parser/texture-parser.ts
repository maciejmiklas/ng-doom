/*
 * Copyright 2022 Maciej Miklas
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
import * as R from 'ramda';
import {
	BitmapSprite,
	Column,
	Directories,
	Directory,
	DoomTexture,
	FrameDir,
	Palette,
	Patch,
	PatchBitmap,
	PatchHeader,
	Playpal,
	Pnames,
	Post,
	RGB,
	Sprite,
	TextureDir
} from './wad-model';
import U from '../../common/util';
import {functions as dp} from './directory-parser';
import {Either} from '@maciejmiklas/functional-ts';
import {Log} from '../../common/log';

/*
 * @see https://doomwiki.org/wiki/Picture_format
 * @see https://www.cyotek.com/blog/decoding-doom-picture-files
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ImageData/ImageData
 * @see https://doomwiki.org/wiki/COLORMAP
 * @see https://doomwiki.org/wiki/PLAYPAL
 */

const TRANSPARENT_PIXEL = -1;
const TRANSPARENT_RGB: RGB = {
	r: 0,
	b: 0,
	g: 0,
	a: 0
};
const IMG_BYTES = 4;
const POST_PADDING_BYTES = 4;
const LAST_POST_MARKER = 0XFF;
const RBG_BYTES = 3;
const PLAYPAL_COLORS = 256;
const PLAYPAL_BYTES = RBG_BYTES * 256;
const CMP = 'BPA';

const parseRBG = (bytes: number[]) => (idx: number): RGB => {
	return {
		r: bytes[idx],
		g: bytes[idx + 1],
		b: bytes[idx + 2],
		a: 255
	};
};

const parsePlaypal = (wadBytes: number[], dirs: Directory[]): Playpal => {
	const dir = dp.findDirectoryByName(dirs)(Directories.PLAYPAL).get();
	const paletteParser = parsePalette(wadBytes, dir);
	const palettes = R.range(0, 13).map(idx => paletteParser(idx));
	return {dir, palettes};
};

const parsePalette = (paletteBytes: number[], dir: Directory) => (paletteNumber: number): Palette => {
	const parseRBGBytes = parseRBG(paletteBytes);
	const bytesOffset = dir.filepos + paletteNumber * PLAYPAL_BYTES;
	const colors = R.range(0, PLAYPAL_COLORS).map(idx => parseRBGBytes(bytesOffset + idx * 3));
	return {colors, idx: paletteNumber};
};

const unfoldColumnofs = (filepos: number, width: number): number[] =>
	R.unfold((idx) => idx === width ? false : [filepos + idx * IMG_BYTES, idx + 1], 0);

const parsePatchHeader = (wadBytes: number[]) => (dir: Directory): PatchHeader => {
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

/** #wadBytes - whole WAD */
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

/** #wadBytes - whole WAD */
const parseColumn = (wadBytes: number[], dir: Directory) => (filepos: number): Either<Column> => {
	const postParser = parsePost(wadBytes);
	return Either.until<Post>(
		p => postParser(p.filepos + p.data.length + POST_PADDING_BYTES), // p here is the previous post
		postParser(filepos), () => dir.name + ' has Empty Column at: ' + filepos).map(posts => ({posts}));
};

const parseBitmap = (wadBytes: number[], palette: Palette) => (dir: Directory): Either<PatchBitmap> => {
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
			rgba
		}));
};

const parsePnames = (wadBytes: number[], dirs: Directory[]): Pnames => {
	const dir: Directory = dp.findDirectoryByName(dirs)(Directories.PNAMES).get();
	const nummappatches = U.parseInt(wadBytes)(dir.filepos);
	const strParser = U.parseStr(wadBytes);
	const names: string[] = R
		.range(0, nummappatches) // ()=> Patches amount
		.map(idx => strParser(dir.filepos + 0x04 + 8 * idx, 8).toUpperCase()); // (patch offset)=> patch names
	return {dir, nummappatches, names};
};

const parseTextures = (wadBytes: number[], dirs: Directory[], pnames: Pnames, patches: PatchBitmap[]) => (td: TextureDir): Either<DoomTexture[]> => {
	const dir: Directory = dp.findDirectoryByName(dirs)(td).get();
	const intParser = U.parseInt(wadBytes);
	const textureParser = parseTexture(wadBytes, dirs, dir, pnames, patches);
	const offset = dir.filepos;
	const textures: DoomTexture[] = R
		.range(0, intParser(offset))// ()=> Textures amount (numtextures)
		.map(idx => offset + intParser(offset + 0x04 + idx * 4))// ()=> offsets to Textures
		.map(offset => textureParser(offset))// ()=> Either<DoomTexture>
		.filter(dt => dt.isRight())// TODO such filtering removes elements without logging -> add method filter with log!
		.map(dt => dt.get());
	return Either.ofCondition(() => textures.length > 0, () => 'No textures found', () => textures);
};

const parseTexture = (wadBytes: number[], dirs: Directory[], dir: Directory, pnames: Pnames, allPatches: PatchBitmap[]) => (offset: number): Either<DoomTexture> => {
	const strParser = U.parseStr(wadBytes);
	const shortParser = U.parseShort(wadBytes);
	const patchCountWad = shortParser(offset + 0x14);
	const patchMapParser = parsePatch(wadBytes, dirs, pnames, allPatches);
	const patches = R
		.range(0, patchCountWad)// ()=> patches amount
		.map(pn => offset + 22 + pn * 10)//(patch number) => patch offset
		.map(offset => patchMapParser(offset))// (patch offset)=> Either<Patch>
		.filter(e => e.isRight())// remove Left
		.map(e => e.get()); // (Either<Patch>) => Patch

	return Either.ofCondition(() => patchCountWad === patches.length,
		() => 'Incorrect Patches amount for Texture from ' + dir + ', found: ' + patches.length,
		() => ({
			dir,
			name: strParser(offset, 8),
			width: shortParser(offset + 0x0C),
			height: shortParser(offset + 0x0E),
			patchCount: patches.length,
			patches
		}));
};

const parsePatch = (wadBytes: number[], dirs: Directory[], pnames: Pnames, patches: PatchBitmap[]) => (offset: number): Either<Patch> => {
	const shortParser = U.parseShort(wadBytes);
	const patchIdx = shortParser(offset + 0x04);
	const patchName = Either.ofCondition(
		() => patchIdx < pnames.names.length,
		() => 'patchIdx (' + patchIdx + ') out of bound (' + pnames.names.length + ') at:' + offset,
		() => pnames.names[patchIdx]);

	const bitmap = patchName.map(pn => patches.find(p => p.header.dir.name === pn));
	return Either.ofTruth([patchName, bitmap], () => ({
		originX: shortParser(offset),
		originY: shortParser(offset + 0x02),
		patchIdx,
		patchName: patchName.get(),
		bitmap: bitmap.get()
	}));
};

const findPatchDir = (dirs: Directory[]) => (patchName: string): Either<Directory> =>
	dp.findDirectoryByName(dirs)(patchName);

const parsePatches = (wadBytes: number[], dirs: Directory[], palette: Palette): PatchBitmap[] => {
	const patchDirFinder = findPatchDir(dirs);
	const bitmapParser = parseBitmap(wadBytes, palette);
	return parsePnames(wadBytes, dirs).names
		.map(pn => patchDirFinder(pn)) // (dirName)=> Either<Directory>
		.filter(d => d.isRight()).map(d => d.get()) // (Either<Directory>)=>Directory
		.map(d => bitmapParser(d)).filter(b => b.isRight()).map(b => b.get()); // (Directory) => PatchBitmap
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
	const array = new Uint8ClampedArray(width * height * IMG_BYTES);
	const pixelToImg = pixelToImgBuf(array, palette);
	let idx = 0;
	U.itn(0, height, (y) => {
		U.itn(0, width, (x) => {
			idx = pixelToImg(idx, pixAtCol(x, y));
		});
	});
	return array;
};

const patchToRGBA = (bitmap: PatchBitmap) => (palette: Palette): Uint8ClampedArray =>
	patchDataToRGBA(bitmap.columns, bitmap.header.width, bitmap.header.height, palette);

const pixelToImgBuf = (img: Uint8ClampedArray, palette: Palette) => (idx: number, pixel: number): number => {
	const rgb = pixel === -1 ? TRANSPARENT_RGB : palette.colors[pixel];
	img[idx++] = rgb.r;
	img[idx++] = rgb.g;
	img[idx++] = rgb.b;
	img[idx++] = rgb.a;
	return idx;
};

const postPixelAt = (columns: Either<Column>[]) => (x: number, y: number): number => {
	return postAt(columns)(x, y)
		.assert(p => Either.ofCondition(() => p.data.length > y - p.topdelta,
			() => 'Pixel out of range at:(' + x + ',' + y + ')->' + p.data.length + '<=' + y + '-' + p.topdelta, () => 'OK'))
		.map(p => p.data[y - p.topdelta]).orElseGet(() => TRANSPARENT_PIXEL);
};

const postAt = (columns: Either<Column>[]) => (x: number, y: number): Either<Post> =>
	columns[x].map(c => Either.ofNullable(R.find<Post>(p => y >= p.topdelta && y < p.topdelta + p.data.length)(c.posts),
		() => 'Transparent pixel at (' + x + ',' + y + ')'));

const toImageData = (bitmap: PatchBitmap): ImageData => {
	return new ImageData(bitmap.rgba, bitmap.header.width, bitmap.header.height);
};

const paintOnCanvasForZoom = (bitmap: PatchBitmap, canvas: HTMLCanvasElement) => (scale: number, maxSize = 300): HTMLImageElement => {
	const ctx = canvas.getContext('2d');
	const maxOrgSize = Math.max(bitmap.header.width, bitmap.header.height);
	const curSize = scale * maxOrgSize;
	if (curSize > maxSize) {
		scale = maxSize / maxOrgSize;
	}

	canvas.width = bitmap.header.width * scale;
	canvas.height = bitmap.header.height * scale;
	ctx.putImageData(toImageData(bitmap), 0, 0);

	const imageObject = new Image();
	imageObject.onload = () => {
		ctx.scale(scale, scale);
		ctx.drawImage(imageObject, 0, 0);
	};
	imageObject.src = canvas.toDataURL();
	return imageObject;
};

const maxSpriteSize = (sprite: BitmapSprite): number => Math.max(
	sprite.frames.map(s => s.header.width).reduce((prev, cur) => prev > cur ? prev : cur),
	sprite.frames.map(s => s.header.height).reduce((prev, cur) => prev > cur ? prev : cur));

const calcScale = (maxScale: number) => (sprite: BitmapSprite): number => {
	let scale = maxScale / maxSpriteSize(sprite);
	return scale - scale % 1;
};

const toBitmapSprites = (sprite: Sprite): Either<BitmapSprite[]> => {
	const sprites = Object.keys(sprite.animations).map(angle => sprite.animations[angle]).map((d: FrameDir[]) => toBitmapSprite(d))
		.filter(md => md.isRight()).map(md => md.get());
	return Either.ofCondition(() => sprites.length > 0, () => sprite.name + ' has no sprites', () => sprites);
};

const toBitmapSprite = (frame: FrameDir[]): Either<BitmapSprite> => {
	const frames: PatchBitmap[] = frame.filter(f => f.bitmap.isRight()).map(f => f.bitmap.get());
	const first = frame[0];
	return Either.ofCondition(() => frames.length > 0, () => first.spriteName + ' has no frames', () => ({
		name: first.spriteName,
		angle: first.angle.toString(),
		frames
	}));
};

const toImageBitmap = (bitmap: PatchBitmap) => (width: number, height: number): Promise<ImageBitmap> => {
	return createImageBitmap(toImageData(bitmap), {resizeWidth: width, resizeHeight: height});
};

// ############################ EXPORTS ############################
export const testFunctions = {
	findPatchDir,
	parsePost,
	unfoldColumnofs,
	parsePalette,
	parseRBG,
	parsePatchHeader,
	parseColumn,
	postPixelAt,
	toBitmapSprite,
	toImageData,
	patchToRGBA,
	maxSpriteSize,
	postAt,
	patchDataToRGBA
};
export const functions = {
	parseTextures,
	parsePatches,
	parsePnames,
	parseBitmap,
	parsePlaypal,
	toImageBitmap,
	paintOnCanvasForZoom,
	calcScale,
	toBitmapSprites
};
