import {Column, Directory, PatchBitmap, PatchHeader, Post} from './wad_model';
import * as R from 'ramda';
import U from '../common/util';
import {Either} from '../common/either';

const IMG_BYTES = 4;
const POST_PADDING_BYTES = 4;
const LAST_POST_MARKER = 0XFF;

/**
 * @see https://doomwiki.org/wiki/Picture_format
 * @see https://www.cyotek.com/blog/decoding-doom-picture-files
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ImageData/ImageData
 * @see https://doomwiki.org/wiki/COLORMAP
 * @see https://doomwiki.org/wiki/PLAYPAL
 */
const unfoldColumnofs = (filepos: number, width: number): number[] =>
	R.unfold((idx) => idx === width ? false : [filepos + idx * IMG_BYTES, idx + 1], 0);

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
	return Either.ofCondition(() => topdelta !== LAST_POST_MARKER, () => 'End of column', () =>
		({
			topdelta,
			filepos,
			data: R.unfold((idx) => idx === length ? false : [ubyteParser(filepos + idx + 3), idx + 1], 0)
		}));
};

const parseColumn = (bytes: number[]) => (filepos: number): Either<Column> => {
	const postParser = parsePost(bytes);
	return Either.until<Post>(
		p => postParser(p.filepos + p.data.length + POST_PADDING_BYTES), // p here is the previous post
		postParser(filepos)).map(posts => ({posts}));
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
	const pixAtCol = postPixelAt(columns);
	const array = new Uint8ClampedArray(header.width * header.height * IMG_BYTES);
	const column = R.until(({x, y}) => y < header.height, ({x, y}) => {
		array.set(pixelToImg(pixAtCol(x, y)), x * y * IMG_BYTES);
		return {x, y: ++y};
	});
	R.until(({x, y}) => x < header.width,
		({x, y}) => {
			column({x, y});
			return {x: ++x, y: 0};
		})({x: 0, y: 0});
	return array;
};

const patchToImgLoop = (header: PatchHeader, columns: Column[]): Uint8ClampedArray => {
	const pixAtCol = postPixelAt(columns);
	const array = new Uint8ClampedArray(header.width * header.height * IMG_BYTES);
	const pixConv = pixelToImgBuf(array);
	let idx = 0;
	for (let y = 0; y < header.height; y++) {
		for (let x = 0; x < header.width; x++) {
			idx = pixConv(idx, pixAtCol(x, y));
		}
	}
	return array;
};

const pixelToImgBuf = (img: Uint8ClampedArray) => (idx: number, pixel: number): number => {
	img[idx++] = (pixel) & 0b111000000;    // R value
	img[idx++] = (pixel << 3) & 0b111000000;  // G value
	img[idx++] = (pixel << 6) & 0b11000000;    // B value
	img[idx++] = 255;  // A value
	return idx;
};

const pixelToImg = (pixel: number): number[] => {
	const img = new Array<number>(4);
	img[0] = (pixel) & 0b111000000;    // R value
	img[1] = (pixel << 3) & 0b111000000;  // G value
	img[2] = (pixel << 6) & 0b11000000;    // B value
	img[3] = 255;  // A value
	return img;
};

const parsePatchBitmap = (bytes: number[]) => (dir: Directory): Either<PatchBitmap> => {
	const header = parsePatchHeader(bytes)(dir);
	const columnParser = parseColumn(bytes);
	const columns = header.columnofs.map(colOfs => columnParser(colOfs)).filter(c => c.isRight()).map(c => c.get());
	return Either.ofCondition(
		() => columns.length === header.width,
		() => 'Some columns (' + columns.length + '/' + header.width + ') are missing in Picture : ' + dir,
		() => ({
			header,
			columns,
			imageData: patchToImgLoop(header, columns)
		}));
};

const postPixelAt = (columns: Column[]) => (x: number, y: number): number => {
	return postAt(columns)(x, y)
		.assert(p => Either.ofCondition(() => p.data.length > y - p.topdelta, () => 'Pixel out of range at:(' + x + ',' + y + ')->' + p.data.length + '<=' + y + '-' + p.topdelta, () => 'OK'))
		.map(p => p.data[y - p.topdelta]).orElseGet(() => 0);
};

const postAt = (columns: Column[]) => (x: number, y: number): Either<Post> =>
	Either.ofNullable(R.find<Post>(p => y >= p.topdelta && y < p.topdelta + p.data.length)(columns[x].posts), () => 'Transparent pixel at (' + x + ',' + y + ')');

export const testFunctions = {
	postAt,
	parsePost,
	postPixelAt,
	parsePatchHeader,
	unfoldColumnofs,
	parseColumn,
	pixelToImg
};

export const functions = {
	parseBitmap: parsePatchBitmap
};
