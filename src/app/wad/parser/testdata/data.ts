/*
 * Copyright 2022 Maciej Miklas
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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
import {functions as mp, testFunctions as tf, testFunctions as mpt} from '../map-parser'
import {functions as dp} from '../directory-parser'
import {functions as tp} from '../texture-parser'
import {functions as pp} from '../playpal-parser'

import {
	Bitmap,
	BitmapHeader,
	Column,
	Directory,
	DoomMap,
	DoomTexture,
	Header,
	Linedef,
	MapLumpType,
	Palette,
	Pnames,
	Post,
	Sector,
	VectorV,
	Vertex
} from '../wad-model'

import jsonData from './doom.json'
import U from '../../../common/util'
import {Either} from '../../../common/either'

export type VectorId = VectorV & {
	id: number,
	msg?: string
	crossing_flag?: boolean
}

let _linedefs = null
export const getE1M1Linedefs = (): Linedef[] => {
	if (!_linedefs) {
		const vertexes = tf.parseVertexes(getWadBytes())(getE1M1Dirs())
		const sidedefs = tf.parseSidedefs(getWadBytes(), tf.createTextureLoader(getTextures()))(getE1M1Dirs(), getSectors())
		_linedefs = tf.parseLinedefs(getWadBytes(), getE1M1Dirs(), vertexes, sidedefs, getSectors())
	}
	return _linedefs
}

let _wadBytes = null
export const getWadBytes = (): number[] => {
	if (!_wadBytes) {
		// @ts-ignore
		_wadBytes = U.base64ToUint8NumberArray(jsonData.doom)
	}
	return _wadBytes
}

let _maps = null
export const getMaps = (): DoomMap[] => {
	if (!_maps) {
		_maps = mp.parseMaps(getWadBytes(), getAllDirs(), getTextures(), getFlats()).get()
	}
	return _maps
}

let _e1M1Dirs = null
export const getE1M1Dirs = (): Directory[] => {
	if (_e1M1Dirs == null) {
		_e1M1Dirs = tf.parseMapDirs(getAllDirs())(tf.findNextMapStartingDir(getAllDirs())(0).get()).get()
	}
	return _e1M1Dirs
}

let _sectors = null
export const getSectors = (): Sector[] => {
	if (_sectors == null) {
		_sectors = tf.parseSectors(getWadBytes())(getE1M1Dirs(), tf.createFlatLoader(getFlats()))
	}
	return _sectors
}

let _palette = null
export const getPalette = (): Palette => {
	if (_palette == null) {
		_palette = pp.parsePlaypal(getWadBytes(), getAllDirs()).get().palettes[0]
	}
	return _palette
}

let _pnames = null
export const getPnames = (): Pnames => {
	if (_pnames == null) {
		_pnames = tp.parsePnames(getWadBytes(), getAllDirs()).get()
	}
	return _pnames
}

let _patches = null
export const getPatches = (): Bitmap[] => {
	if (_patches == null) {
		_patches = tp.parsePatches(getWadBytes(), getAllDirs(), getPalette(), getPnames()).get()
	}
	return _patches
}

let _textures = null
export const getTextures = (): DoomTexture[] => {
	if (!_textures) {
		_textures = tp.parseTextures(getWadBytes(), getAllDirs(), getPnames(), getPatches()).get()
	}
	return _textures
}

let _flats = null
export const getFlats = (): Bitmap[] => {
	if (!_flats) {
		_flats = tp.parseFlats(getWadBytes(), getAllDirs(), getPalette()).get()
	}
	return _flats
}

let _header = null
export const getHeader = () => {
	if (!_header) {
		_header = dp.parseHeader(getWadBytes())
	}
	return _header
}

let _allDirs = null
export const getAllDirs = (): Directory[] => {
	if (!_allDirs) {
		_allDirs = getHeader().map(header => dp.parseAllDirectories(header, getWadBytes()).get())
	}
	return _allDirs.get()
}

export const getAllDirsOp = (): Either<Directory[]> => {
	getAllDirs()
	return _allDirs
}

let _firstMap = null
export const getFirstMap = () => {
	if (!_firstMap) {
		_firstMap = getAllDirsOp().map(dirs => mpt.findNextMapStartingDir(dirs)).get()(0).get()
	}
	return _firstMap
}

export const FIRST_MAP_DIR_OFFSET = 6; // starting from 0
export const FD_E1M1: Directory = {
	filepos: 67500,
	size: 0,
	name: 'E1M1',
	idx: 6
}

export const E1M1_THINGS: Directory = {
	filepos: 67500,
	size: 1380,
	name: MapLumpType[MapLumpType.THINGS],
	idx: 7
}

export const E1M1_LINEDEFS: Directory = {
	filepos: 68880,
	size: 6650,
	name: MapLumpType[MapLumpType.LINEDEFS],
	idx: 8
}

export const E1M1_BLOCKMAP: Directory = {
	filepos: 116296,
	size: 6922,
	name: MapLumpType[MapLumpType.BLOCKMAP],
	idx: 16
}

export const FD_E1M2: Directory = {
	filepos: 123220,
	size: 0,
	name: 'E1M2',
	idx: 17
}

export const VERTEX_0: Vertex = {
	x: 1088,
	y: -3680
}

export const VERTEX_1: Vertex = {
	x: 1024,
	y: -3680
}

export const VERTEX_2: Vertex = {
	x: 1024,
	y: -3648
}

export const VERTEX_3: Vertex = {
	x: 1088,
	y: -3648
}

export const VERTEX_26: Vertex = {
	x: 1344,
	y: -3360
}

export const VERTEX_27: Vertex = {
	x: 1344,
	y: -3264
}

export const VERTEX_466: Vertex = {
	x: 2912,
	y: -4848
}

export const verifySimpleDoomImageAt0x0 = (post: Post) => {
	expect(post.topdelta).toEqual(0)
	expect(post.filepos).toEqual(1000)
	expect(post.data[0]).toEqual(11)
	expect(post.data[2]).toEqual(13)
}

export const verifySimpleDoomImageAt0x1 = (post: Post) => {
	expect(post.topdelta).toEqual(20)
	expect(post.filepos).toEqual(1003)
	expect(post.data[0]).toEqual(21)
	expect(post.data[1]).toEqual(22)
}

export const verifySimpleDoomImageAt0x2 = (post: Post) => {
	expect(post.topdelta).toEqual(22)
	expect(post.filepos).toEqual(1005)
	expect(post.data[0]).toEqual(31)
	expect(post.data[1]).toEqual(32)
}

export const verifySimpleDoomImageAt1x0 = (post: Post) => {
	expect(post.topdelta).toEqual(0)
	expect(post.filepos).toEqual(2000)
	expect(post.data[0]).toEqual(101)
	expect(post.data[1]).toEqual(102)
}

export const verifySimpleDoomImageAt1x1 = (post: Post) => {
	expect(post.topdelta).toEqual(60)
	expect(post.filepos).toEqual(2003)
	expect(post.data[0]).toEqual(110)
	expect(post.data[1]).toEqual(111)
}

export const verifySimpleDoomImageAt2x0 = (post: Post) => {
	expect(post.topdelta).toEqual(0)
	expect(post.filepos).toEqual(3000)
	expect(post.data[0]).toEqual(201)
	expect(post.data[1]).toEqual(202)
	expect(post.data[2]).toEqual(203)
	expect(post.data[3]).toEqual(204)
}

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
	])

export const eqDir = (dir: Directory, given: Directory) => {
	expect(dir.name).toEqual(given.name)
	expect(dir.filepos).toEqual(given.filepos)
	expect(dir.size).toEqual(given.size)
	expect(dir.idx).toEqual(given.idx)
}

export const validateDir = (header: Header) => (nr: number, given: Directory) => {
	const dir = dp.parseDirectory(header.infotableofs + 16 * nr, nr, getWadBytes())
	eqDir(dir, given)
}

export const validateTitleColumn = (col: Column) => {
	const posts = col.posts
	expect(posts.length).toEqual(2)
	expect(posts[0].topdelta).toEqual(0)
	expect(posts[1].topdelta).toEqual(posts[0].data.length)
	expect(posts[0].data.length + posts[1].data.length).toEqual(200)
}

export const validateTitlePatchHeader = (header: BitmapHeader) => {
	expect(header.width).toEqual(320)
	expect(header.height).toEqual(200)
	expect(header.xOffset).toEqual(0)
	const dir = header.dir

	// Sizes:
	//  - patch header: 6
	//  - columnofs array: 4 * header.width
	//  - 2 padding bytes after #columnofs
	const firstPostOffset = dir.filepos + 6 + 4 * header.width + 2

	expect(header.columnofs[0]).toEqual(firstPostOffset)

	// FIXME it's 1075 bytes over dir-size, is this legit?
	const maxFilePos = dir.filepos + dir.size + 1075
	expect(firstPostOffset).toBeLessThan(maxFilePos)

	for (const postFilePos of header.columnofs) {
		expect(postFilePos).toBeGreaterThanOrEqual(firstPostOffset)
		expect(postFilePos).toBeLessThanOrEqual(maxFilePos)
	}
	expect(header.yOffset).toEqual(0)
}

export const pathContinuousOpen: VectorId[] = [
	{"id": 201, "start": {"x": 100, "y": 200}, "end": {"x": 110, "y": 210}},
	{"id": 202, "start": {"x": 110, "y": 210}, "end": {"x": 120, "y": 220}},
	{"id": 203, "start": {"x": 120, "y": 220}, "end": {"x": 130, "y": 230}},
	{"id": 204, "start": {"x": 130, "y": 230}, "end": {"x": 140, "y": 240}},
	{"id": 205, "start": {"x": 140, "y": 240}, "end": {"x": 150, "y": 250}}]

export const pathClosedMixed: VectorId[] = [
	{"id": 8, "start": {"x": 1728, "y": -704}, "end": {"x": 1856, "y": -704}},
	{"id": 2, "start": {"x": 2048, "y": -1024}, "end": {"x": 1792, "y": -1280}},
	{"id": 3, "start": {"x": 1792, "y": -1280}, "end": {"x": 1472, "y": -1280}},
	{"id": 4, "start": {"x": 1472, "y": -1280}, "end": {"x": 1472, "y": -1088}},
	{"id": 6, "start": {"x": 1472, "y": -960}, "end": {"x": 1472, "y": -704}},
	{"id": 0, "start": {"x": 1856, "y": -704}, "end": {"x": 2048, "y": -704}},
	{"id": 7, "start": {"x": 1472, "y": -704}, "end": {"x": 1728, "y": -704}},
	{"id": 1, "start": {"x": 2048, "y": -704}, "end": {"x": 2048, "y": -1024}},
	{"id": 5, "start": {"x": 1472, "y": -1088}, "end": {"x": 1472, "y": -960}}
]

export const pathClosedSorted: VectorId[] = [
	{"id": 0, "start": {"x": 1856, "y": -704}, "end": {"x": 2048, "y": -704}},
	{"id": 1, "start": {"x": 2048, "y": -704}, "end": {"x": 2048, "y": -1024}},
	{"id": 2, "start": {"x": 2048, "y": -1024}, "end": {"x": 1792, "y": -1280}},
	{"id": 3, "start": {"x": 1792, "y": -1280}, "end": {"x": 1472, "y": -1280}},
	{"id": 4, "start": {"x": 1472, "y": -1280}, "end": {"x": 1472, "y": -1088}},
	{"id": 5, "start": {"x": 1472, "y": -1088}, "end": {"x": 1472, "y": -960}},
	{"id": 6, "start": {"x": 1472, "y": -960}, "end": {"x": 1472, "y": -704}},
	{"id": 7, "start": {"x": 1472, "y": -704}, "end": {"x": 1728, "y": -704}},
	{"id": 8, "start": {"x": 1728, "y": -704}, "end": {"x": 1856, "y": -704}}]

export const pathClosedMixed2: VectorId[] = [
	{"id": 10, "start": {"x": 10, "y": 20}, "end": {"x": 100, "y": 200}},
	{"id": 14, "start": {"x": 700, "y": 800}, "end": {"x": 10, "y": 20}},
	{"id": 12, "start": {"x": 300, "y": 400}, "end": {"x": 500, "y": 600}},
	{"id": 13, "start": {"x": 500, "y": 600}, "end": {"x": 700, "y": 800}},
	{"id": 11, "start": {"x": 100, "y": 200}, "end": {"x": 300, "y": 400}}]

export const pathClosedReversedOne: VectorId[] = [
	{"id": 20, "start": {"x": 10, "y": 20}, "end": {"x": 100, "y": 200}},
	{"id": 24, "start": {"x": 700, "y": 800}, "end": {"x": 10, "y": 20}},
	{"id": 22, "start": {"x": 300, "y": 400}, "end": {"x": 500, "y": 600}},
	{"id": 23, "start": {"x": 700, "y": 800}, "end": {"x": 500, "y": 600}},// reversed
	{"id": 21, "start": {"x": 100, "y": 200}, "end": {"x": 300, "y": 400}}]

export const pathClosedReversedMix: VectorId[] = [
	{"id": 40, "start": {"x": 64, "y": -3392}, "end": {"x": 128, "y": -3264}},
	{"id": 41, "start": {"x": 128, "y": -3264}, "end": {"x": 128, "y": -3200}},
	{"id": 42, "start": {"x": 128, "y": -3200}, "end": {"x": 64, "y": -3072}},
	{"id": 43, "start": {"x": 48, "y": -3072}, "end": {"x": 64, "y": -3072}},
	{"id": 44, "start": {"x": -64, "y": -3136}, "end": {"x": 48, "y": -3072}},
	{"id": 45, "start": {"x": -64, "y": -3136}, "end": {"x": -64, "y": -3328}},
	{"id": 46, "start": {"x": 48, "y": -3392}, "end": {"x": -64, "y": -3328}},
	{"id": 47, "start": {"x": 64, "y": -3392}, "end": {"x": 48, "y": -3392}},
]

/**
 Sector37, two crossings A and B

           -------------------102-----------------------
       101 -                                           - 103
   ---204--A------------------104-----------------------
   -       -
   -       -
   -       -
   -       -
   -       -
   2       2
   0       0
   3       1
   -       -
   -       -
   -       -
   -       -
   -       -
   ---202--B-------------------301----------------------
       304 -                                           - 302
           --------------------303----------------------
 */
export const pathCrossingClosedOrdered: VectorId[] = [
	// @formatter:off
	{"id": 101, "start": {"x": 928, "y": -3104}, "end": {"x": 928, "y": -3072}, msg: 'Crossing A on: [928, -3104]', crossing_flag:true},
	{"id": 102, "start": {"x": 928, "y": -3072}, "end": {"x": 1184, "y": -3072}},
	{"id": 103, "start": {"x": 1184, "y": -3072}, "end": {"x": 1184, "y": -3104}},
	{"id": 104, "start": {"x": 1184, "y": -3104}, "end": {"x": 928, "y": -3104}, msg: 'Crossing A on: [928, -3104]', crossing_flag:true},
	{"id": 201, "start": {"x": 928, "y": -3104}, "end": {"x": 928, "y": -3360}, msg: 'Crossing A on: [928, -3104] and B on: [928, -3360]', crossing_flag:true},
	{"id": 202, "start": {"x": 928, "y": -3360}, "end": {"x": 896, "y": -3360}, msg: 'Crossing B on: [928, -3360]', crossing_flag:true},
	{"id": 203, "start": {"x": 896, "y": -3360}, "end": {"x": 896, "y": -3104}},
	{"id": 204, "start": {"x": 896, "y": -3104}, "end": {"x": 928, "y": -3104}, msg: 'Crossing A on: [928, -3104]', crossing_flag:true},
	{"id": 301, "start": {"x": 928, "y": -3360}, "end": {"x": 1184, "y": -3360}, msg: 'Crossing B on: [928, -3360]', crossing_flag:true},
	{"id": 302, "start": {"x": 1184, "y": -3360}, "end": {"x": 1184, "y": -3392}},
	{"id": 303, "start": {"x": 1184, "y": -3392}, "end": {"x": 928, "y": -3392}},
	{"id": 304, "start": {"x": 928, "y": -3392}, "end": {"x": 928, "y": -3360}, msg: 'Crossing B on: [928, -3360]', crossing_flag:true},
	// @formatter:on
]

export const pathCrossingMixed: VectorId[] = [
	// @formatter:off
	{"id": 101, "start": {"x": 928, "y": -3104}, "end": {"x": 928, "y": -3072}, msg: 'Crossing A on: [928, -3104]', crossing_flag:true},
	{"id": 103, "start": {"x": 1184, "y": -3104}, "end": {"x": 1184, "y": -3072}},
	{"id": 201, "start": {"x": 928, "y": -3104}, "end": {"x": 928, "y": -3360}, msg: 'Crossing A on: [928, -3104] and B on: [928, -3360]', crossing_flag:true},
	{"id": 104, "start": {"x": 928, "y": -3104}, "end": {"x": 1184, "y": -3104}, msg: 'Crossing A on: [928, -3104]', crossing_flag:true},
	{"id": 202, "start": {"x": 928, "y": -3360}, "end": {"x": 896, "y": -3360}, msg: 'Crossing B on: [928, -3360]', crossing_flag:true},
	{"id": 302, "start": {"x": 1184, "y": -3360}, "end": {"x": 1184, "y": -3392}},
	{"id": 304, "start": {"x": 928, "y": -3392}, "end": {"x": 928, "y": -3360}, msg: 'Crossing B on: [928, -3360]', crossing_flag:true},
	{"id": 102, "start": {"x": 928, "y": -3072}, "end": {"x": 1184, "y": -3072}},
	{"id": 301, "start": {"x": 928, "y": -3360}, "end": {"x": 1184, "y": -3360}, msg: 'Crossing B on: [928, -3360]', crossing_flag:true},
	{"id": 203, "start": {"x": 896, "y": -3104}, "end": {"x": 896, "y": -3360}},
	{"id": 204, "start": {"x": 896, "y": -3104}, "end": {"x": 928, "y": -3104}, msg: 'Crossing A on: [928, -3104]', crossing_flag:true},
	{"id": 303, "start": {"x": 1184, "y": -3392}, "end": {"x": 928, "y": -3392}},
	// @formatter:on
]

const getById = (vectors: VectorId[]) => (id: number) => vectors.find(v => v.id === id)
export const getCCOById = getById(pathCrossingClosedOrdered)

export const pathCrossingClosedMixed: VectorId[] = [
	getCCOById(301), getCCOById(103), getCCOById(104), getCCOById(201), getCCOById(202), getCCOById(302),
	getCCOById(203), getCCOById(304), getCCOById(102), getCCOById(204), getCCOById(101), getCCOById(303)
]

export const pathCrossing300Full100Started: VectorId[][] = [
	[getCCOById(102)],
	[getCCOById(301), getCCOById(302), getCCOById(303), getCCOById(304)]
]

export const pathCrossing300Full: VectorId[][] = [
	[getCCOById(301), getCCOById(302), getCCOById(303), getCCOById(304)]
]

export const pathCrossingsPartial: VectorId[][] = [
	[getCCOById(102), getCCOById(103)],
	[getCCOById(203)],
	[getCCOById(302), getCCOById(303)]
]

export const pathCrossingsMissing200: VectorId[][] = [
	[getCCOById(101), getCCOById(102), getCCOById(103), getCCOById(104)],
	[getCCOById(301), getCCOById(302), getCCOById(303), getCCOById(304)],
	[getCCOById(203)],
]



