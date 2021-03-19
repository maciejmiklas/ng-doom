import {testFunctions as mpt} from '../wad/map_parser';
import {functions as dp} from '../wad/directory_parser';

import {Column, Directory, Header, MapLumpType, PatchHeader, Vertex} from '../wad/wad_model';

import jsonData from './doom.json';
import {Either} from '../common/either';
import U from '../common/util';

// @ts-ignore
export const WAD_BYTES = U.base64ToUint8Array(jsonData.doom);

export const FIRST_MAP_DIR_OFFSET = 6; // starting from 0
export const HEADER: Either<Header> = dp.parseHeader(WAD_BYTES);
export const ALL_DIRS: Either<Directory[]> = HEADER.map(header => dp.parseAllDirectories(header, WAD_BYTES).get());
export const FIRST_MAP: Directory = ALL_DIRS.map(dirs => mpt.findNextMapDir(dirs)).get()(0).get();

export const FD_E1M1: Directory = {
	filepos: 130300,
	size: 0,
	name: 'E1M1',
	idx: 6
};

export const FD_E1M2: Directory = {
	filepos: 186020,
	size: 0,
	name: 'E1M2',
	idx: 17
};

export const E1M1_THINGS: Directory = {
	filepos: 130300,
	size: 1380,
	name: MapLumpType[MapLumpType.THINGS],
	idx: 7
};

export const E1M1_LINEDEFS: Directory = {
	filepos: 131680,
	size: 6650,
	name: MapLumpType[MapLumpType.LINEDEFS],
	idx: 8
};

export const E1M1_BLOCKMAP: Directory = {
	filepos: 179096,
	size: 6922,
	name: MapLumpType[MapLumpType.BLOCKMAP],
	idx: 16
};

export const VERTEX_0: Vertex = {
	x: 1088,
	y: -3680
};

export const VERTEX_1: Vertex = {
	x: 1024,
	y: -3680
};

export const VERTEX_2: Vertex = {
	x: 1024,
	y: -3648
};

export const VERTEX_3: Vertex = {
	x: 1088,
	y: -3648
};

export const VERTEX_26: Vertex = {
	x: 1344,
	y: -3360
};

export const VERTEX_27: Vertex = {
	x: 1344,
	y: -3264
};

export const VERTEX_466: Vertex = {
	x: 2912,
	y: -4848
};

export const eqDir = (dir: Directory, given: Directory) => {
	expect(dir.name).toEqual(given.name);
	expect(dir.filepos).toEqual(given.filepos);
	expect(dir.size).toEqual(given.size);
	expect(dir.idx).toEqual(given.idx);
};

export const validateDir = (header: Header) => (nr: number, given: Directory) => {
	const dir = dp.parseDirectory(header.infotableofs + 16 * nr, nr, WAD_BYTES);
	eqDir(dir, given);
};

export const validateTitleColumn = (col: Column) => {
	const posts = col.posts;
	expect(posts.length).toEqual(2);
	expect(posts[0].topdelta).toEqual(0);
	expect(posts[1].topdelta).toEqual(posts[0].data.length);
	expect(posts[0].data.length + posts[1].data.length).toEqual(200);
};

export const validateTitlePatchHeader = (header: PatchHeader) => {
	expect(header.width).toEqual(320);
	expect(header.height).toEqual(200);
	expect(header.xOffset).toEqual(0);
	const dir = header.dir;

	// Sizes:
	//  - patch header: 6
	//  - columnofs array: 4 * header.width
	//  - 2 padding bytes after #columnofs
	const firstPostOffset = dir.filepos + 6 + 4 * header.width + 2;

	expect(header.columnofs[0]).toEqual(firstPostOffset);

	// FIXME it's 1075 bytes over dir-size, is this legit?
	const maxFilePos = dir.filepos + dir.size + 1075;
	expect(firstPostOffset).toBeLessThan(maxFilePos);

	for (const postFilePos of header.columnofs) {
		expect(postFilePos).toBeGreaterThanOrEqual(firstPostOffset);
		expect(postFilePos).toBeLessThanOrEqual(maxFilePos);
	}
	expect(header.yOffset).toEqual(0);
};
