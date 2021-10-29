import {Column, Directories, Directory, Palette, PatchBitmap, PatchHeader, Playpal, Post, RGB} from './wad_model';
import * as R from 'ramda';
import U from '../../common/is/util';
import {Either} from '@maciejmiklas/functional-ts';
import {functions as dp} from './directory_parser';
import {Log} from '../../common/is/log';

/**
 * @see https://doomwiki.org/wiki/Picture_format
 * @see https://www.cyotek.com/blog/decoding-doom-picture-files
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ImageData/ImageData
 * @see https://doomwiki.org/wiki/COLORMAP
 * @see https://doomwiki.org/wiki/PLAYPAL
 */
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
	return {colors};
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
		height: shortParser(filepos + 2),
		xOffset: shortParser(filepos + 4),
		yOffset: shortParser(filepos + 6),
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

const parseBitmap = (wadBytes: number[]) => (dir: Directory): Either<PatchBitmap> => {
	Log.debug(CMP, 'Parse Bitmap:', dir);
	const header = parsePatchHeader(wadBytes)(dir);
	const columnParser = parseColumn(wadBytes, dir);
	const columns: Either<Column>[] = header.columnofs.map(colOfs => columnParser(colOfs));

	return Either.ofCondition(
		() => columns.length === header.width,
		() => 'Some columns (' + columns.length + '/' + header.width + ') are missing in Picture : ' + dir.name + ' at ' + dir.filepos,
		() => ({
			header,
			columns
		}));
};

const postAt = (columns: Column[]) => (x: number, y: number): Either<Post> =>
	Either.ofNullable(R.find<Post>(p => y >= p.topdelta && y < p.topdelta + p.data.length)(columns[x].posts),
		() => 'Transparent pixel at (' + x + ',' + y + ')');

export const testFunctions = {
	postAt,
	parsePost,
	unfoldColumnofs,
	parsePalette,
	parseRBG,
	parsePatchHeader,
	parseColumn
};

export const functions = {
	parseBitmap,
	parsePlaypal
};
