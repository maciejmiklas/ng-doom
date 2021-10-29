import {Column, Palette, PatchBitmap, Post, RGB} from './wad_model';
import * as R from 'ramda';
import U from '../../common/is/util';
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

const postPixelAt = (columns: Column[]) => (x: number, y: number): number => {
	return postAt(columns)(x, y)
		.assert(p => Either.ofCondition(() => p.data.length > y - p.topdelta,
			() => 'Pixel out of range at:(' + x + ',' + y + ')->' + p.data.length + '<=' + y + '-' + p.topdelta, () => 'OK'))
		.map(p => p.data[y - p.topdelta]).orElseGet(() => TRANSPARENT_PIXEL);
};

const postAt = (columns: Column[]) => (x: number, y: number): Either<Post> =>
	Either.ofNullable(R.find<Post>(p => y >= p.topdelta && y < p.topdelta + p.data.length)(columns[x].posts),
		() => 'Transparent pixel at (' + x + ',' + y + ')');

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

const toImageBitmap = (bitmap: PatchBitmap) => (width: number, height: number) => (palette: Palette): Promise<ImageBitmap> => {
	return createImageBitmap(toImageData(bitmap)(palette), {resizeWidth: width, resizeHeight: height});
};

export const testFunctions = {
	postPixelAt
};

export const functions = {
	toImageData,
	toImageBitmap,
	paintOnCanvasForZoom
};
