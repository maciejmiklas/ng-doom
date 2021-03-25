import {Column, Directory, PatchBitmap, PatchHeader, Post} from './wad_model';
import * as R from 'ramda';
import U from '../common/util';
import {Either} from '../common/either';

/**
 * @see https://doomwiki.org/wiki/Picture_format
 * @see https://www.cyotek.com/blog/decoding-doom-picture-files
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ImageData/ImageData
 */

const unfoldColumnofs = (filepos: number, width: number): number[] =>
	R.unfold((idx) => idx === width ? false : [filepos + idx * 4, idx + 1], 0);

const parsePatchHeader = (bytes: number[]) => (dir: Directory): PatchHeader => {
	const shortParser = U.parseShort(bytes);
	const uintParser = U.parseUint(bytes);
	const filepos = dir.filepos;
	const width = shortParser(filepos);
	return {
		dir,
		width,
		height: shortParser(filepos + 2),
		xOffset: shortParser(filepos + 4),
		yOffset: shortParser(filepos + 6),
		columnofs: unfoldColumnofs(filepos + 8, width).map((offset) => filepos + uintParser(offset))
	};
};

const parsePost = (bytes: number[]) => (filepos: number): Either<Post> => {
	const ubyteParser = U.parseUbyte(bytes);
	const topdelta = ubyteParser(filepos);
	const length = ubyteParser(filepos + 1);
	return Either.ofCondition(() => topdelta !== 0XFF, () => 'End of column', () =>
		({
			topdelta,
			filepos,
			postBytes: 4 + length,
			data: R.unfold((idx) => idx === length ? false : [ubyteParser(filepos + idx + 3), idx + 1], 0)
		}));
};

const parseColumn = (bytes: number[]) => (filepos: number): Either<Column> => {
	const postParser = parsePost(bytes);
	return Either.until<Post>(
		p => postParser(p.filepos + p.postBytes), postParser(filepos))
		.map(posts => ({posts}));
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
const patchToImg = (header: PatchHeader, columns: Column[]): Uint8ClampedArray => {
	const array = new Uint8ClampedArray(header.width * header.height * 4);
	const mapToImageColumnByt = columnToImg(array, header.width);
	R.addIndex<Column>(R.forEach)((c, idx) => mapToImageColumnByt(idx, c), columns);
	return array;
};

const columnToImg = (img: Uint8ClampedArray, width: number) => (x: number, column: Column): void => {
	const postToImageByt = postToImg(img, width, x);
	column.posts.forEach(p => postToImageByt(p));
};

const pixelToImg = (img: Uint8ClampedArray) => (pixel: number, idx: number): void => {
	img[idx++] = (pixel) & 0b111000000;    // R value
	img[idx++] = (pixel << 3) & 0b111000000;  // G value
	img[idx++] = (pixel << 6) & 0b11000000;    // B value
	img[idx++] = 255;  // A value
};

const postToImg = (img: Uint8ClampedArray, width: number, x: number) => (post: Post): void => {
	const pixelConv = pixelToImg(img);
	let y = post.topdelta;
	post.data.forEach(pixel => pixelConv(pixel, (y++ * width + x) * 4));
	// R.addIndex(post.data.forEach)((pixel, idx) => pixelConv(pixel, ((post.topdelta + idx) * width + x) * 4));
};

const parseBitmap = (bytes: number[]) => (dir: Directory): Either<PatchBitmap> => {
	const header = parsePatchHeader(bytes)(dir);
	const columnParser = parseColumn(bytes);
	const columns = header.columnofs.map(colOfs => columnParser(colOfs)).filter(c => c.isRight()).map(c => c.get());
	return Either.ofCondition(
		() => columns.length === header.width,
		() => 'Some columns (' + columns.length + '/' + header.width + ') are missing in Picture : ' + dir,
		() => ({
			header,
			columns,
			imageData: patchToImg(header, columns)
		}));
};

export const testFunctions = {
	parsePatchHeader,
	unfoldColumnofs,
	parseColumn,
	pixelToImage: pixelToImg
};

export const functions = {
	parseBitmap
};
