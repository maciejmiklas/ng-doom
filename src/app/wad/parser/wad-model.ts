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

/**
 * WAD - "Where's All the Data?" contains maps for each level, monsters, pickups, sound and textures, so basically
 * whole data set for DOOM game.
 *
 * WAD begins with a Header, this one contains offset to list of Directory entries and amount of directories.
 * Each Directory contains name of the Lump and pointed to data in file for this Lump.
 *
 * Lump is basically any kind of data that can be found in WAD and the location of the Lump is given by Directory.
 *
 * Map consists of Lumps such: Thing (monster) or Linedef (wall), but Lump can be also a texture or sound.
 */
import {Either} from '../../common/either'
import * as R from 'ramda'
import U from "../../common/util";

export type Header = {
	identification: WadType

	/** Number of lumps in WAD. */
	numlumps: number

	/** Offset in WAD to the location of the directory. */
	infotableofs: number
}

/**
 * The directory associates names of lumps with the data that belong to them. It consists of a number of entries,
 * each with a length of 16 bytes. The length of the directory is determined by the number given in the WAD header.
 *
 * @see https://doomwiki.org/wiki/WAD#Directory
 */
export type Directory = {

	/** Index of this directory in Directory[] starting from 0. It also indicates position (order) in file. */
	idx: number

	/** Start of Lump's data in WAD  */
	filepos: number

	/** Lump size in bytes. Lump position int WAD: [#filepos,....,#filepos + size] */
	size: number

	/** Lump's name. Map contains of few predefined Lumps (MapLumpType), but there are also types of Lumps. */
	name: string
}

/**
 * Names of static directories
 */
export enum Directories {
	PLAYPAL = 'PLAYPAL',
	TITLEPIC = 'TITLEPIC',
	VERTEXES = 'VERTEXES',
	CREDIT = 'CREDIT',
	M_DOOM = 'M_DOOM',
	S_START = 'S_START',
	S_END = 'S_END',
	PNAMES = 'PNAMES',
	TEXTURE1 = 'TEXTURE1',
	TEXTURE2 = 'TEXTURE2',
	F_START = 'F_START',
	F_END = 'F_END'
}

/**
 * Lump's names and their order within single map. The first element does not indicate a real Lump, it's just a
 * starting directory of the map.
 */
export enum MapLumpType {
	MAP_NAME,
	THINGS,
	LINEDEFS,
	SIDEDEFS,
	VERTEXES,
	SEGS,
	SSECTORS,
	NODES,
	SECTORS,
	REJECT,
	BLOCKMAP
}

/**
 * Lump is an abstract data type found in each map.
 * Each Lump definition starts with Directory containing type of the Lump and pointer to Lump's data in WAD.
 */
export type Lump = {
	dir: Directory
}

/**
 * Set of color palettes used to render images and archive special effects
 *
 * @see https://doomwiki.org/wiki/PLAYPAL
 */
export type Playpal = Lump & {
	palettes: Palette[]
}

export type Palette = {
	idx: number
	colors: RGBA[]
}

export type RGBA = {
	r: number,
	g: number,
	b: number,
	a: number
}

/**
 * Lump is an abstract data type found in each map.
 * Each Lump definition starts with Directory containing type of the Lump and pointer to Lump's data in WAD.
 */
export type MapLump = Lump & {
	lumpType: MapLumpType
}

/** range from -32768 to +32767 */
export type Position = {
	x: number,
	y: number
}

/**
 * Things represent players, monsters, pick-ups, and projectiles. Inside the game, these are known as actors, or mobjs. They also represent
 * obstacles, certain decorations, player start positions and teleport landing sites.
 *
 * While some mobjs, such as projectiles and special effects, can only be created during play, most things can be placed in a map from a
 * map editor through an associated editor number. When the map is loaded, an actor that corresponds to that number will be spawned at the
 * location of that map thing. See thing types for a listing of all things that have an associated editor number.
 *
 * see: https://doomwiki.org/wiki/Thing
 */
export type Thing = MapLump & {
	position: Position
	angleFacing: number,
	thingType: number,// TODO type should be enum from https://doomwiki.org/wiki/Thing_types#Monsters
	flags: number
}

export enum ThingType {
	PLAYER = 1
}

/**
 * Position on the map. WAD contains list of all possible positions stored in Lump: VERTEXES.
 * SIDEDEFS contains list of walls on particular map, where each wall references two Vertex, as it's start and end
 * position on the map.
 *
 * @see https://doomwiki.org/wiki/Vertex
 */
export type Vertex = Position & {
	x: number,
	y: number
}

export enum VectorConnection {
	V1END_TO_V2START,
	V1START_TO_V2END,
	V1START_TO_V2START,
	V1END_TO_V2END,
	NONE,
}

export type VectorV = {
	id?: number,
	specialType?: number,
	start: Vertex,
	end: Vertex
}

const CROSSING_FLAG = "crossing_flag";
const isCrossingVector = (v: VectorV) => v[CROSSING_FLAG] !== undefined
const areCrossing = (v1: VectorV, v2: VectorV) => isCrossingVector(v1) && isCrossingVector(v2)

export type CrossingVectors<V extends VectorV> = {

	/**
	 * Crossing consists of at least three vectors sharing a common point.
	 * In this case, we have multiple shapes sharing the same edge.
	 *
	 * Each vector from this list has a mark that can be checked with: #isCrossingVector(...)
	 */
	crossing: V[][],
	remaining: V[]
}

export const MIN_VECTOR_V = <VectorV>{
	start: {x: -Infinity, y: -Infinity},
	end: {x: -Infinity, y: -Infinity}
}

/**
 * Linedef represents single wall on the map, or action. Wall is more like a line between #start and #end.
 * Textures for the wall are defined by Sidedef. A few Linedef with the same #sectorTag belong to the same Sector,
 * which makes up a closed space - a room. Sector defines textures for flor and celling, height of the celling and \
 * lighting in this Sector (room)
 *
 * @see https://doomwiki.org/wiki/Linedef
 */
export type Linedef = VectorV & MapLump & {
	id: number
	flags: Set<LinedefFlag>
	specialType: number
	sectorTag: number
	sector: Sector
	frontSide: Sidedef
	backSide: Either<Sidedef>
}

export enum FlatType {
	HOLES, // FlatWithHoles
	SHAPES, // FlatWithShapes
	AREA//FlatArea
}

/**  Flat(flor or celling) is deducted from Linedef and contains closed shapes and holes. */
export type Flat = {
	sector: Sector
	type: FlatType
}

export type FlatWithHoles = Flat & {
	walls: Linedef[],
	holes: Linedef[][]
}

export type FlatWithShapes = Flat & {
	walls: Linedef[][],
}

export type FlatArea = Flat & {
	walls: Linedef[],
}

/**  @see https://doomwiki.org/wiki/Linedef#Linedef_flags  */
export enum LinedefFlag {
	BLOCKS_PLAYERS_MONSTERS = 1,
	BLOCKS_MONSTERS = 2,
	TWO_SIDED = 3,
	UPPER_TEXTURE_UNPEGGED = 4,
	LOWER_TEXTURE_UNPEGGED = 5,
	SECRET = 6,
	BLOCKS_SOUND = 7,
	NEVER_SHOWS_ON_AUTOMAP = 8,
	ALWAYS_SHOWS_ON_AUTOMAP = 9
}

/**
 * Sidedef contains textures for each wall on the map (Linedef)
 *
 * @see https://doomwiki.org/wiki/Sidedef
 * @see https://doomwiki.org/wiki/Texture_alignment
 */
export type Sidedef = MapLump & {
	/**
	 * x: How many pixels to shift all the sidedef textures on the X axis (right or left).
	 * y: How many pixels to shift all the sidedef textures on the Y axis (up or down).
	 */
	offset: Position

	/**
	 * The texture that will be displayed on the border between a sector and its neighboring ceiling of a different
	 * height. If the linedef that contains this sidedef is one-sided this field is meaningless.
	 */
	upperTexture: Either<DoomTexture>

	/**
	 * On one-sided linedefs this will be the only texture displayed; as the main wall texture. On two-sided linedefs this will be displayed
	 * as a 'floating' texture which the player is able to walk through. Middle floating textures can be used to achieve a variety of faux 3D
	 * effects such as 3D bridges. Note that middle floating textures will only tile horizontally and not vertically, where they only repeat
	 * once.
	 */
	middleTexture: Either<DoomTexture>

	/**
	 * Performs a similar function to the upper texture; the lower texture is displayed on the border between a sectorId and its neighboring
	 * floor of a different height.
	 */
	lowerTexture: Either<DoomTexture>

	/** Sector this sidedef 'faces' */
	sector: Sector
}

/**
 * A Sector is an area defined by a few Sidedef (wall) building a room. Each Sector has a height of the celling, texture on celling and
 * flor, and lighting.
 *
 * @see https://doomwiki.org/wiki/Sector
 */
export type Sector = MapLump & {
	id: number
	floorTexture: Either<Bitmap>
	floorHeight: number
	cellingTexture: Either<Bitmap>
	cellingHeight: number
	lightLevel: number
	specialType: number
	tagNumber: number
}

/**
 * Map can be found within WAD as a directory with Name following syntax: ExMy or MAPxx. This directory is being followed by:
 * <pre>
	 E1M1
	 THINGS
	 LINEDEFS
	 SIDEDEFS
	 VERTEXES
	 SEGS
	 SSECTORS
	 NODES
	 SECTORS
	 REJECT
	 BLOCKMAP
 </pre>
 * Each Map contains those directories in exact this order.
 */
export type DoomMap = {
	mapName: string
	mapDirs: Directory[]
	things: Thing[]
	player: Either<Thing>
	linedefBySector: LinedefBySector[]
	sectors: Sector[]
	linedefs: Linedef[]

	/** https://doomwiki.org/wiki/Sky */
	sky: Either<DoomTexture>
}

/** Linedefs for a given sector.  */
export type LinedefBySector = {
	sector: Sector

	/** All Linedefs in this sector in random order. */
	linedefs: Linedef[]

	/** Linedefs defining an action given by #specialType */
	actions: Linedef[]
	flat: Flat
}

export enum WadType {
	IWAD,
	PWAD
}

/**
 * Bitmap column (known as post) of Doom's bitmap. Offset to each column is given by BitmapHeader#columnofs
 *
 * @see https://doomwiki.org/wiki/Picture_format -> Posts
 */
export type Post = {

	/** vertical (y) offset of this post in patch. */
	topdelta: number

	/**
	 * Array of pixels is this post. Length is given by #length.
	 * Each pixel has value 0-255, and it's an index in Doom palate
	 */
	data: number[]

	/** Starting position in WAD of this Post */
	filepos: number
}

/**
 * Data of each column is divided into posts, which are lines going downward on the screen (columns).
 *
 * Each post has offset in pixels, that gives its position in column. There could be gap between Posts - in
 * such case free pixels are transparent
 */
export type Column = {
	posts: Post[]
}

/**
 * Title pictures from WAD
 *
 * @see https://doomwiki.org/wiki/Title_screen
 */
export type TitlePic = {
	help: Either<Bitmap[]>
	title: Bitmap,
	credit: Bitmap,
	mDoom: Bitmap
}

/**
 * Sprites represent graphics used in Things, for example: gun, monster, pickup, power up.
 *
 * Directory Name not only provides name for the Sprite, but also info about animation frames and angle: first 4-characters are the
 * Sprite's name, 5-th character is the frame number for animation (A-Z), following characters define angle.
 * Example: SHTGA0,SHTGB0,SHTGAC0 -> Sprite SHTG, single angle 0, 3 frames: A, B, C.
 *
 * Some sprites can have mirrored image, for example: SARGC3C7 -> this represents two frames: SARGC3 and SARGC7 as mirror image of the
 * first one.
 *
 * Each sprite consists of multiple directories, where each one provides info for a single frame.
 *
 * @see https://doomwiki.org/wiki/Sprite
 */
export type Sprite = {

	/** 4 character upper case name of sprite. */
	name: string,

	/**
	 * K: angle, V: frames for animation. Each entry in Bitmap[] represents single frame,
	 * for example: Bitmap[0] -> A, Bitmap[1] -> B
	 */
	animations: Record<string, FrameDir[]>
}

/**
 * Contains names for all patches (texture name) for single wall texture.
 * @see https://doomwiki.org/wiki/PNAMES
 */
export type Pnames = Lump & {
	/** An integer holding the number of following patches.  */
	nummappatches: number,

	/**
	 * Eight-character ASCII strings defining the lump names of the patches. Only the characters A-Z (uppercase), 0-9, and [ ] - _ should
	 * be used in lump names[citation needed]. When a string is less than 8 bytes long, it should be null-padded to the eighth byte.
	 */
	names: string[]
}

export type RgbaBitmap = {
	name: string,
	width: number,
	height: number,
	rgba: Uint8ClampedArray,

	/** The palette that has been used to render this image. */
	palette?: Palette
}

/**
 * Header of Doom Picture (Patch)
 * @see https://doomwiki.org/wiki/Picture_format
 */
export type BitmapHeader = {
	dir: Directory
	width: number
	height: number
	xOffset: number
	yOffset: number

	/**
	 * Columns offsets relative to start of WAD file.
	 * Size of this array is given by width, because it represents horizontal lines on bitmap.
	 * Each value in this array points to byes array in WAD file, the size of this array is determined by height.
	 *
	 * For picture 320x200 we have #columnofs with 320 entries, each one pointing to array in WAD that is 200 bytes long
	 */
	columnofs: number[]
}

/**
 * Picture/bitmap in Doom's Patch format
 *
 * @see https://doomwiki.org/wiki/Picture_format
 * @see https://www.cyotek.com/blog/decoding-doom-picture-files
 */
export type Bitmap = RgbaBitmap & {
	header: BitmapHeader

	/** Picture in Doom format consists of columns (x-axis) going downward on the screen (y-axis). */
	columns: Either<Column>[]

	rgba: Uint8ClampedArray
}

/**
 * Defines a texture for the wall
 *
 * @see https://doomwiki.org/wiki/TEXTURE1_and_TEXTURE2
 * @see https://doomwiki.org/wiki/Texture_alignment
 */
export type DoomTexture = Lump & RgbaBitmap & {
	patchCount: number
	patches: Patch[]
};

/**
 * Patch defines how the patch should be drawn inside the texture.
 *
 * @see https://doomwiki.org/wiki/TEXTURE1_and_TEXTURE2
 */
export type Patch = {
	/** The horizontal offset of the patch relative to the upper-left of the texture.  */
	originX: number,

	/** The vertical offset of the patch relative to the upper-left of the texture.  */
	originY: number,

	/** The patch number (as listed in PNAMES) to draw.  */
	patchIdx: number

	/** The patch name from PNAMES. */
	patchName: string

	bitmap: Bitmap
}

export type BitmapSprite = {
	name: string,
	angle: string,
	frames: Bitmap[]
}

export type FrameDir = {
	/** A, B, C,....F */
	frameName: string,
	spriteName: string,
	angle: number,
	mirror: boolean,
	bitmap: Either<Bitmap>,
	dir: Directory,
}

export type Wad = {
	header: Header,
	title: TitlePic,
	maps: DoomMap[],
	dirs: Directory[],
	pnames: Pnames,
	patches: Bitmap[]
	bytes: number[],
	playpal: Playpal,
	textures: DoomTexture[],
	flatBitmaps: RgbaBitmap[]

	/** The palette that has been used to render bitmaps within this WAS. */
	palette: Palette
}

export type WadEntry = {
	wad: Wad
	name: string
	gameSave: GameSave[]
}

export type GameSave = {
	name: string
}

// ######################### FUNCTIONS #########################
const vertexEqual = (v1: Vertex, v2: Vertex): boolean => v1.x === v2.x && v1.y === v2.y

const vectorsEqual = <V extends VectorV>(v1: V, v2: V): boolean =>
	(vertexEqual(v1.start, v2.start) && vertexEqual(v1.end, v2.end)) ||
	(vertexEqual(v1.start, v2.end) && vertexEqual(v1.end, v2.start))

const reverseVector = <V extends VectorV>(input: V): V => {
	const resp = {...input}
	resp.end = input.start
	resp.start = input.end
	return resp
}

const pathToPoints = (vectors: VectorV[]): Vertex[] =>
	R.uniqWith<Vertex, Vertex>((v1, v2) => v1.x === v2.x && v1.y === v2.y)(R.flatten(vectors.map(v => [v.start, v.end])))

const hasVertex = (vertex: Vertex) => (vector: VectorV): boolean =>
	vertexEqual(vertex, vector.start) || vertexEqual(vertex, vector.end)

const vectorReversed = (vectors: VectorV[]) => (ve: VectorV): boolean =>
	!vectors.find(v => {
		const con = vectorsConnected(ve, v)
		return con === VectorConnection.V1END_TO_V2START || con === VectorConnection.V1START_TO_V2END ? v : undefined
	})

const vectorsConnected = (v1: VectorV, v2: VectorV): VectorConnection =>
	R.cond([
		[(v1, v2) => vertexEqual(v1.start, v2.end), () => VectorConnection.V1START_TO_V2END],
		[(v1, v2) => vertexEqual(v1.start, v2.start), () => VectorConnection.V1START_TO_V2START],
		[(v1, v2) => vertexEqual(v1.end, v2.start), () => VectorConnection.V1END_TO_V2START],
		[(v1, v2) => vertexEqual(v1.end, v2.end), () => VectorConnection.V1END_TO_V2END],
		[R.T, () => VectorConnection.NONE]
	])(v1, v2)

const reversed = (con: VectorConnection) => con === VectorConnection.V1START_TO_V2START || con === VectorConnection.V1END_TO_V2END;

const countVertex = (vectors: VectorV[]) => (vertex: Vertex) =>
	R.reduce<VectorV, number>((acc, v) => hasVertex(vertex)(v) ? ++acc : acc, 0, vectors)

const uniqueVertex = (vectors: VectorV[]): Vertex[] => {

	// collect all Vertex from #vectors int list
	const vertexes = R.flatten(vectors.map(v => [v.start, v.end]))

	// remove duplicates
	return R.uniqWith(vertexEqual, vertexes)
}

const uniqueVector = <V extends VectorV>(vectors: V[]): V[] =>
	R.uniqWith(vectorsEqual, vectors)

const findFirstVectorByVertex = (vectors: VectorV[]) => (vertex: Vertex): Either<number> => {
	const idx = vectors.findIndex(v => hasVertex(vertex)(v))
	return Either.ofCondition(() => idx >= 0, () => 'No Vector for:' + JSON.stringify(vertex), () => idx)
}

/** V[0] - vectors containing given vertex, V[1] - remaining vectors. */
const groupByVertex = <V extends VectorV>(vectors: V[]) => (vertex: Vertex): Either<V[][]> => {
	const remaining = vectors.filter(v => !hasVertex(vertex)(v), vectors)
	const found = vectors.filter(v => hasVertex(vertex)(v), vectors)
	return Either.ofCondition(
		() => found.length > 0,
		() => 'Vertex: ' + stringifyVertex(vertex) + ' not found in: ' + stringifyVectors(vectors),
		() => [found, remaining])
}

/**
 * @return true, if both points of the given vector are in a given list of points.
 */
const hasVector = <V extends VectorV>(points: Vertex[]) => (vector: V): boolean =>
	points.find(v => vertexEqual(v, vector.start)) !== undefined && points.find(v => vertexEqual(v, vector.end)) !== undefined

const filterSectorSplitters = <V extends VectorV>(vectors: V[]): V[] => {
	// find common points (vertex) for crossing vectors
	const crossingVertex = uniqueVertex(vectors).filter(v => countVertex(vectors)(v) > 2)

	// Now we have shared points (Vertex) for all crossing vectors. If a particular vector has both ends in this list
	// and it's an action, it means that this vector splits the sector into two parts and should be removed.
	const has = hasVector(crossingVertex)
	return vectors.filter(v => v.specialType === 0 || !has(v))
}

const groupCrossingVectors = <V extends VectorV>(vectors: V[]): Either<CrossingVectors<V>> => {
	// Vectors are crossing when at least 3 vectors share a common point. #crossingVertex contains such points.
	const crossingVertex = uniqueVertex(vectors).filter(v => countVertex(vectors)(v) > 2)

	return Either.ofCondition(
		() => vectors.length > 0 && crossingVertex.length > 0,
		() => 'No crossings',
		() => {
			let remaining = vectors;
			const crossing: V[][] = crossingVertex.map(cv =>

				// Vertex => Either<V[][]> where V[0] contains crossings, V[1] remaining vectors
				groupByVertex(remaining)(cv)

					.exec(v => {
						// use for next iteration vectors from grouping to avoid duplicates
						remaining = v[1]

						// mark crossing vectors so that we can recognize those later on
						v[0].forEach(cc => cc[CROSSING_FLAG] = true)
					})

					// put crossings into output array
					.orElse(() => [])[0]
			)
			return {
				crossing: crossing.filter(c => c != undefined && c.length > 0),
				remaining
			};
		})
}

/** Closed path where last element connect to first one, might be not continuos. */
const pathClosed = (vectors: VectorV[]): boolean =>
	vectors.length > 2 && vectorsConnected(vectors[0], vectors[vectors.length - 1]) !== VectorConnection.NONE

const pathsContinuos = (paths: VectorV[][]): boolean =>
	paths.filter(pathContinuos).length == paths.length

/** Continuos and closed path. */
const pathContinuos = (path: VectorV[]): boolean => {

	// #nextRoll will ensure that we compare last element with first one once iterator gets to the end of the path
	const nextRoll = U.nextRoll(path)

	// path needs at least 3 elements
	return path.length > 2 &&

		// optimization - do not iterate over whole path, when start does not connect to an end
		pathClosed(path) &&

		// compare each element in list with next one to ensure that siblings are connected
		path.every((el, idx) =>
			vertexEqual(el.end, nextRoll(idx + 1).start))
}

const toSimpleVectors = <V extends VectorV>(vectors: V[]): VectorV[] => vectors.map(v => toSimpleVector(v))
const toSimpleVector = <V extends VectorV>(v: V): VectorV => ({id: v.id, start: v.start, end: v.end})

const stringifyVectors = (vectors: VectorV[]): string => JSON.stringify(toSimpleVectors(vectors)).replace(/\\"/g, '"')
const stringifyVector = (v: VectorV): string => JSON.stringify(toSimpleVector(v))
const stringifyVertex = (v: Vertex): string => JSON.stringify(v)

const findMinX = (vs: VectorV[]): number =>
	R.reduce((min: number, ld: VectorV) => Math.min(min, ld.start.x, ld.end.x), Number.MAX_SAFE_INTEGER, vs)

const findMaxX = (vs: VectorV[]): number =>
	R.reduce((min: number, ld: VectorV) => Math.max(min, ld.start.x, ld.end.x), Number.MIN_SAFE_INTEGER, vs)

const findMinY = (vs: VectorV[]): number =>
	R.reduce((min: number, ld: VectorV) => Math.min(min, ld.start.y, ld.end.y), Number.MAX_SAFE_INTEGER, vs)

const findMaxY = (vs: VectorV[]): number =>
	R.reduce((min: number, ld: VectorV) => Math.max(min, ld.start.y, ld.end.y), Number.MIN_SAFE_INTEGER, vs)

const findMax = (vs: VectorV[]): number =>
	R.reduce((max: number, ld: VectorV) => Math.max(max, ld.start.x, ld.start.y, ld.end.x, ld.end.y),
		Number.MIN_SAFE_INTEGER, vs)

export const functions = {
	findMinX,
	findMaxX,
	findMinY,
	findMaxY,
	findMax,
	pathContinuos,
	vertexEqual,
	reverseVector,
	pathToPoints,
	hasVertex,
	vectorsConnected,
	vectorReversed,
	countVertex,
	uniqueVertex,
	findFirstVectorByVertex,
	groupByVertex,
	groupCrossingVectors,
	pathClosed,
	toSimpleVectors,
	toSimpleVector,
	stringifyVectors,
	stringifyVector,
	reversed,
	isCrossingVector,
	areCrossing,
	vectorsEqual,
	hasVector,
	filterSectorSplitters,
	uniqueVector,
	pathsContinuos
}
