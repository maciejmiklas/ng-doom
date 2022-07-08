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
	Bitmap,
	BitmapSprite,
	Directories,
	Directory,
	DoomTexture,
	FrameDir,
	Palette,
	Patch,
	Pnames,
	RgbaBitmap,
	Sprite
} from './wad-model';
import U from '../../common/util';
import {functions as dp} from './directory-parser';
import {functions as bp} from './bitmap-parser';
import {Either} from '../../common/either';

const RGBA_BYTES = 4;

const parsePnames = (wadBytes: number[], dirs: Directory[]): Pnames => {
	const dir: Directory = dp.findDirectoryByName(dirs)(Directories.PNAMES).get();
	const nummappatches = U.parseInt32(wadBytes)(dir.filepos);
	const strParser = U.parseStr(wadBytes);
	const names: string[] = R
		.range(0, nummappatches) // ()=> Patches amount
		.map(idx => strParser(dir.filepos + 0x04 + 8 * idx, 8).toUpperCase()); // (patch offset)=> patch names
	return {dir, nummappatches, names};
};

const findPatchDir = (dirs: Directory[]) => (patchName: string): Either<Directory> =>
	dp.findDirectoryByName(dirs)(patchName);

const parsePatches = (wadBytes: number[], dirs: Directory[], palette: Palette): Bitmap[] => {
	const patchDirFinder = findPatchDir(dirs);
	const bitmapParser = bp.parseBitmap(wadBytes, palette);
	return parsePnames(wadBytes, dirs).names
		.map(pn => patchDirFinder(pn)) // (dirName)=> Either<Directory>
		.filter(d => d.isRight()).map(d => d.get()) // (Either<Directory>)=>Directory
		.map(d => bitmapParser(d)).filter(b => b.isRight()).map(b => b.get()); // (Directory) => Bitmap
};

const parsePatch = (wadBytes: number[], dirs: Directory[], pnames: Pnames, patches: Bitmap[]) => (offset: number): Either<Patch> => {
	const shortParser = U.parseInt16(wadBytes);
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

const parseTexture = (wadBytes: number[], dirs: Directory[], dir: Directory, pnames: Pnames, allPatches: Bitmap[]) => (offset: number): Either<DoomTexture> => {
	const strParser = U.parseStr(wadBytes);
	const shortParser = U.parseInt16(wadBytes);
	const patchCountWad = shortParser(offset + 0x14);
	const patchParser = parsePatch(wadBytes, dirs, pnames, allPatches);
	const patches = R
		.range(0, patchCountWad)// ()=> patches amount
		.map(pn => offset + 22 + pn * 10)//(patch number) => patch offset
		.map(offset => patchParser(offset))// (patch offset)=> Either<Patch>
		.filter(e => e.filter())// remove Left
		.map(e => e.get()); // (Either<Patch>) => Patch
	const width = shortParser(offset + 0x0C);
	const height = shortParser(offset + 0x0E);
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
		}));
};

const parseTextures = (wadBytes: number[], dirs: Directory[], pnames: Pnames, patches: Bitmap[]): Either<DoomTexture[]> => {
	const textures: DoomTexture[] = [];
	const parser = parseTexturesByDir(wadBytes, dirs, pnames, patches);
	parser(Directories.TEXTURE1).exec(tx => textures.push(...tx));
	parser(Directories.TEXTURE2).exec(tx => textures.push(...tx));
	return Either.ofCondition(() => textures.length > 0, () => 'No textures at all!', () => textures);
};

const parseTexturesByDir = (wadBytes: number[], dirs: Directory[], pnames: Pnames, patches: Bitmap[]) => (td: Directories): Either<DoomTexture[]> =>
	dp.findDirectoryByName(dirs)(td).map(dir => {
		const intParser = U.parseInt32(wadBytes);
		const textureParser = parseTexture(wadBytes, dirs, dir, pnames, patches);
		const offset = dir.filepos;
		const textures: DoomTexture[] = R
			.range(0, intParser(offset))// ()=> Textures amount (numtextures)
			.map(idx => offset + intParser(offset + 0x04 + idx * 4))// ()=> offsets to Textures
			.map(offset => textureParser(offset))// ()=> Either<DoomTexture>
			.filter(dt => dt.filter())
			.map(dt => dt.get());
		return Either.ofCondition(() => textures.length > 0, () => 'No textures found', () => textures);
	});

const findFlatDirs = (dirs: Directory[]): Either<Directory[]> =>
	dp.findBetween(dirs)(Directories.F_START, Directories.F_END)((d) => !d.name.includes('_START') && !d.name.includes('_END'));

const parseFlats = (wadBytes: number[], dirs: Directory[], palette: Palette): Either<RgbaBitmap[]> => {
	const bitmapParser = bp.parseBitmap(wadBytes, palette);
	const dd = findFlatDirs(dirs).get();
	dd.forEach(d => console.log('DIR', d));
	const b1 = bitmapParser(dd[0]);
	//const vv = findFlatDirs(dirs).map(dirs => dirs.map(d => bitmapParser(d)));
	return null;
};

const toImageData = (bitmap: RgbaBitmap): ImageData => {
	return new ImageData(bitmap.rgba, bitmap.width, bitmap.height);
};

const paintOnCanvasForZoom = (bitmap: RgbaBitmap, canvas: HTMLCanvasElement) => (scale: number, maxSize = 300): HTMLImageElement => {
	const ctx = canvas.getContext('2d');
	const maxOrgSize = Math.max(bitmap.width, bitmap.height);
	const curSize = scale * maxOrgSize;
	if (curSize > maxSize) {
		scale = maxSize / maxOrgSize;
	}

	canvas.width = bitmap.width * scale;
	canvas.height = bitmap.height * scale;
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
	const scale = maxScale / maxSpriteSize(sprite);
	return scale - scale % 1;
};

const toBitmapSprites = (sprite: Sprite): Either<BitmapSprite[]> => {
	const sprites = Object.keys(sprite.animations).map(angle => sprite.animations[angle]).map((d: FrameDir[]) => toBitmapSprite(d))
		.filter(md => md.isRight()).map(md => md.get());
	return Either.ofCondition(() => sprites.length > 0, () => sprite.name + ' has no sprites', () => sprites);
};

const toBitmapSprite = (frame: FrameDir[]): Either<BitmapSprite> => {
	const frames: Bitmap[] = frame.filter(f => f.bitmap.isRight()).map(f => f.bitmap.get());
	const first = frame[0];
	return Either.ofCondition(() => frames.length > 0, () => first.spriteName + ' has no frames', () => ({
		name: first.spriteName,
		angle: first.angle.toString(),
		frames
	}));
};

const toImageBitmap = (bitmap: Bitmap) => (width: number, height: number): Promise<ImageBitmap> => {
	return createImageBitmap(toImageData(bitmap), {resizeWidth: width, resizeHeight: height});
};

const createTextureRgba = (width: number, height: number, patches: Patch[]): Uint8ClampedArray => {
	const rgba = new Uint8ClampedArray(width * height * RGBA_BYTES);
	const patcher = applyPatch(width, height, rgba);
	patches.forEach(patcher);
	return rgba;
};

const rgbaPixelOffset = (width: number) => (x: number, y: number): number => (x + y * width) * RGBA_BYTES;

const copyRgbaPixel = (fromImg: Uint8ClampedArray, fromOffset: number) => (toImg: Uint8ClampedArray, toOffset: number) =>
	R.range(0, 4).map(idx => toImg[idx + toOffset] = fromImg[idx + fromOffset]);

const applyPatch = (width: number, height: number, to: Uint8ClampedArray) => (from: Patch) => {
	const fromXInit = Math.abs(Math.min(from.originX, 0));
	const fromYInit = Math.abs(Math.min(from.originY, 0));

	const toXInit = Math.max(from.originX, 0);
	const toYInit = Math.max(from.originY, 0);

	const fromXMax = Math.min(width - toXInit, from.bitmap.header.width);
	const fromYMax = Math.min(height - toYInit, from.bitmap.header.height);

	const rgbaPixelOffsetFrom = rgbaPixelOffset(from.bitmap.width);
	const rgbaPixelOffsetTo = rgbaPixelOffset(width);

	for (let fromY = fromYInit, toY = toYInit; fromY < fromYMax; fromY++, toY++) {
		for (let fromX = fromXInit, toX = toXInit; fromX < fromXMax; fromX++, toX++) {
			copyRgbaPixel(from.bitmap.rgba, rgbaPixelOffsetFrom(fromX, fromY))(to, rgbaPixelOffsetTo(toX, toY));
		}
	}
};

// ############################ EXPORTS ############################
export const testFunctions = {
	findPatchDir,
	toBitmapSprite,
	toImageData,
	maxSpriteSize,
	parseTexturesByDir,
	findFlatDirs,
	parseFlats
};
export const functions = {
	parseTextures,
	parsePatches,
	parsePnames,
	toImageBitmap,
	paintOnCanvasForZoom,
	calcScale,
	toBitmapSprites
};
