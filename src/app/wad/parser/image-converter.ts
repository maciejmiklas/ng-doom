import {BitmapSprite, Column, FrameDir, Palette, PatchBitmap, Post, RGB, Sprite} from './wad-model';
import * as R from 'ramda';
import U from '../../common/util';
import {Either} from '@maciejmiklas/functional-ts';

const IMG_BYTES = 4;
const TRANSPARENT_PIXEL = -1;
const TRANSPARENT_RGB: RGB = {
	r: 0,
	b: 0,
	g: 0,
	a: 0
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
const patchToImg = (bitmap: PatchBitmap) => (palette: Palette): Uint8ClampedArray => {
	const pixAtCol = postPixelAt(bitmap.columns);
	const array = new Uint8ClampedArray(bitmap.header.width * bitmap.header.height * IMG_BYTES);
	const pixelToImg = pixelToImgBuf(array, palette);
	let idx = 0;
	U.itn(0, bitmap.header.height, (y) => {
		U.itn(0, bitmap.header.width, (x) => {
			idx = pixelToImg(idx, pixAtCol(x, y));
		});
	});
	return array;
};

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

const toImageData = (bitmap: PatchBitmap) => (palette: Palette): ImageData => {
	const image = patchToImg(bitmap)(palette);
	return new ImageData(image, bitmap.header.width, bitmap.header.height);
};

const paintOnCanvasForZoom = (bitmap: PatchBitmap, canvas: HTMLCanvasElement) => (palette: Palette) => (scale: number): HTMLImageElement => {
	const ctx = canvas.getContext('2d');
	const img = toImageData(bitmap);
	canvas.width = bitmap.header.width * scale;
	canvas.height = bitmap.header.height * scale;
	ctx.putImageData(img(palette), 0, 0);

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

const toImageBitmap = (bitmap: PatchBitmap) => (width: number, height: number) => (palette: Palette): Promise<ImageBitmap> => {
	return createImageBitmap(toImageData(bitmap)(palette), {resizeWidth: width, resizeHeight: height});
};

export const testFunctions = {
	postPixelAt,
	toBitmapSprite,
	maxSpriteSize
};

export const functions = {
	toImageData,
	toImageBitmap,
	paintOnCanvasForZoom,
	calcScale,
	toBitmapSprites
};
