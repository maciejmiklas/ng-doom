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
import {testFunctions as tf, testFunctions as mpt} from '../map-parser';
import {functions as dp} from '../directory-parser';
import {functions as tp} from '../texture-parser';
import {functions as pp} from '../playpal-parser';

import {
	Bitmap,
	BitmapHeader,
	Column,
	Directory,
	DoomTexture,
	Header,
	MapLumpType,
	Palette,
	Pnames,
	Post,
	Sector,
	Vertex
} from '../wad-model';

import jsonData from './doom.json';
import U from '../../../common/util';
import {Either} from '../../../common/either';

let _wadBytes = null;
export const getWadBytes = (): number[] => {
	if (!_wadBytes) {
		// @ts-ignore
		_wadBytes = U.base64ToUint8NumberArray(jsonData.doom);
	}
	return _wadBytes;
};

let _e1M1Dirs = null;
export const getE1M1Dirs = (): Directory[] => {
	if (_e1M1Dirs == null) {
		_e1M1Dirs = tf.parseMapDirs(getAllDirs())(tf.findNextMapStartingDir(getAllDirs())(0).get()).get();
	}
	return _e1M1Dirs;
};

let _sectors = null;
export const getSectors = (): Sector[] => {
	if (_sectors == null) {
		_sectors = tf.parseSectors(getWadBytes())(getE1M1Dirs(), tf.createFlatLoader(getFlats()));
	}
	return _sectors;
};

let _palette = null;
export const getPalette = (): Palette => {
	if (_palette == null) {
		_palette = pp.parsePlaypal(getWadBytes(), getAllDirs()).palettes[0];
	}
	return _palette;
};

let _pnames = null;
export const getPnames = (): Pnames => {
	if (_pnames == null) {
		_pnames = tp.parsePnames(getWadBytes(), getAllDirs());
	}
	return _pnames;
};

let _patches = null;
export const getPatches = (): Bitmap[] => {
	if (_patches == null) {
		_patches = tp.parsePatches(getWadBytes(), getAllDirs(), getPalette());
	}
	return _patches;
};

let _textures = null;
export const getTextures = (): DoomTexture[] => {
	if (!_textures) {
		_textures = tp.parseTextures(getWadBytes(), getAllDirs(), getPnames(), getPatches()).get();
	}
	return _textures;
};

let _flats= null;
export const getFlats = (): Bitmap[] => {
	if (!_flats) {
		_flats = tp.parseFlats(getWadBytes(), getAllDirs(), getPalette()).get();
	}
	return _flats;
};

let _header = null;
export const getHeader = () => {
	if (!_header) {
		_header = dp.parseHeader(getWadBytes());
	}
	return _header;
};

let _allDirs = null;
export const getAllDirs = (): Directory[] => {
	if (!_allDirs) {
		_allDirs = getHeader().map(header => dp.parseAllDirectories(header, getWadBytes()).get());
	}
	return _allDirs.get();
};

export const getAllDirsOp = (): Either<Directory[]> => {
	getAllDirs();
	return _allDirs;
};

let _firstMap = null;
export const getFirstMap = () => {
	if (!_firstMap) {
		_firstMap = getAllDirsOp().map(dirs => mpt.findNextMapStartingDir(dirs)).get()(0).get();
	}
	return _firstMap;
};

export const FIRST_MAP_DIR_OFFSET = 6; // starting from 0
export const FD_E1M1: Directory = {
	filepos: 67500,
	size: 0,
	name: 'E1M1',
	idx: 6
};

export const E1M1_THINGS: Directory = {
	filepos: 67500,
	size: 1380,
	name: MapLumpType[MapLumpType.THINGS],
	idx: 7
};

export const E1M1_LINEDEFS: Directory = {
	filepos: 68880,
	size: 6650,
	name: MapLumpType[MapLumpType.LINEDEFS],
	idx: 8
};

export const E1M1_BLOCKMAP: Directory = {
	filepos: 116296,
	size: 6922,
	name: MapLumpType[MapLumpType.BLOCKMAP],
	idx: 16
};

export const FD_E1M2: Directory = {
	filepos: 123220,
	size: 0,
	name: 'E1M2',
	idx: 17
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

export const verifySimpleDoomImageAt0x0 = (post: Post) => {
	expect(post.topdelta).toEqual(0);
	expect(post.filepos).toEqual(1000);
	expect(post.data[0]).toEqual(11);
	expect(post.data[2]).toEqual(13);
};

export const verifySimpleDoomImageAt0x1 = (post: Post) => {
	expect(post.topdelta).toEqual(20);
	expect(post.filepos).toEqual(1003);
	expect(post.data[0]).toEqual(21);
	expect(post.data[1]).toEqual(22);
};

export const verifySimpleDoomImageAt0x2 = (post: Post) => {
	expect(post.topdelta).toEqual(22);
	expect(post.filepos).toEqual(1005);
	expect(post.data[0]).toEqual(31);
	expect(post.data[1]).toEqual(32);
};

export const verifySimpleDoomImageAt1x0 = (post: Post) => {
	expect(post.topdelta).toEqual(0);
	expect(post.filepos).toEqual(2000);
	expect(post.data[0]).toEqual(101);
	expect(post.data[1]).toEqual(102);
};

export const verifySimpleDoomImageAt1x1 = (post: Post) => {
	expect(post.topdelta).toEqual(60);
	expect(post.filepos).toEqual(2003);
	expect(post.data[0]).toEqual(110);
	expect(post.data[1]).toEqual(111);
};

export const verifySimpleDoomImageAt2x0 = (post: Post) => {
	expect(post.topdelta).toEqual(0);
	expect(post.filepos).toEqual(3000);
	expect(post.data[0]).toEqual(201);
	expect(post.data[1]).toEqual(202);
	expect(post.data[2]).toEqual(203);
	expect(post.data[3]).toEqual(204);
};

export const simpleDoomImage = (): Column[] => (
	[
		{// Column[0]
			posts: [{// (0,0)
				topdelta: 0,
				data: [11, 12, 13],
				filepos: 1000
			}, {// (0,1)
				topdelta: 20,
				data: [21, 22],
				filepos: 1003
			}, {// (0,2)
				topdelta: 22,
				data: [31, 32, 34],
				filepos: 1005
			}]
		},
		{// Column[1]
			posts: [{// (1,0)
				topdelta: 0,
				data: [101, 102, 103],
				filepos: 2000
			}, {// (1,1)
				topdelta: 60,
				data: [110, 111],
				filepos: 2003
			}]
		},
		{// Column[2]
			posts: [{// (2,0)
				topdelta: 0,
				data: [201, 202, 203, 204],
				filepos: 3000
			}]
		}
	]);

export const eqDir = (dir: Directory, given: Directory) => {
	expect(dir.name).toEqual(given.name);
	expect(dir.filepos).toEqual(given.filepos);
	expect(dir.size).toEqual(given.size);
	expect(dir.idx).toEqual(given.idx);
};

export const validateDir = (header: Header) => (nr: number, given: Directory) => {
	const dir = dp.parseDirectory(header.infotableofs + 16 * nr, nr, getWadBytes());
	eqDir(dir, given);
};

export const validateTitleColumn = (col: Column) => {
	const posts = col.posts;
	expect(posts.length).toEqual(2);
	expect(posts[0].topdelta).toEqual(0);
	expect(posts[1].topdelta).toEqual(posts[0].data.length);
	expect(posts[0].data.length + posts[1].data.length).toEqual(200);
};

export const validateTitlePatchHeader = (header: BitmapHeader) => {
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
