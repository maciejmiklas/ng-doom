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
import {config as MC} from "./parser-config"

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
	PLAYPAL = 'PLAYPAL', // The fourteen palettes used at runtime. Detailed on page 246.
	TITLEPIC = 'TITLEPIC',
	VERTEXES = 'VERTEXES',
	CREDIT = 'CREDIT',
	M_DOOM = 'M_DOOM',
	S_START = 'S_START', // Zero-sized lump marking start of item/monster "sprites" section.
	S_END = 'S_END', // Zero-sized lump marking end of item/monster "sprites" section.
	PNAMES = 'PNAMES',
	TEXTURE1 = 'TEXTURE1', // A dictionary of all wall texture lumps referenced by SIDEDEFS.
	TEXTURE2 = 'TEXTURE2',
	F_START = 'F_START', // Zero-sized lump marking the beginning of flat textures.
	F_END = 'F_END' // Zero-sized lump marking the end of flat textures.
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

/**
 * Things represent players, monsters, pick-ups, and projectiles. Inside the game, these are known as actors, or mobjs. They also represent
 * obstacles, certain decorations, player start positions and teleport landing sites.
 *
 * While some mobjs, such as projectiles and special effects, can only be created during play, most things can be placed in a map from a
 * map editor through an associated editor number. When the map is loaded, an actor that corresponds to that number will be spawned at the
 * location of that map thing. See thing types for a listing of all things that have an associated editor number.
 *
 * @see: https://doomwiki.org/wiki/Thing
 * @see: https://doomwiki.org/wiki/Thing_types
 */
export type Thing = MapLump & {
	position: Vertex,
	sector: Sector,
	angleFacing: number,
	thingTypeId: number,
	type: ThingType,
	flags: number
}

export type ThingType = {
	radius: number,
	sprite?: string,
	label: string
}

export enum ThingTypes {
	PLAYER = 1
}

/**
 * x-y position on the map, range from -32768 to +32767.
 * WAD contains list of all possible positions stored in Lump: VERTEXES. SIDEDEFS contains list of walls on particular
 * map, where each wall references two Vertex, as it's start and end position on the map.
 *
 * @see https://doomwiki.org/wiki/Vertex
 */
export type Vertex = {
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

/**
 * @see https://doomwiki.org/wiki/Linedef_type#Table_of_all_types
 */
export enum SpecialType {
	SCROLLING_WALL_LEFT = 48,
}

export type VectorV = {
	id?: number,
	specialType?: number,
	start: Vertex,
	end: Vertex
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

/**  Flat(flor or celling) is deducted from Linedef and contains closed shapes and holes. */
export type Flat = {
	sector: Sector

	/**
	 * The first dimension is a shape, and the second contains walls within this particular shape.
	 * Most sectors have only one shape: [1][walls].
	 *
	 * Each wall is a closed polygon.
	 */
	walls: Linedef[][],
	wallsPolygon: Vertex[][]

	holes: Either<Linedef[][]>
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
	offset: Vertex

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
	floorTexture: Either<RgbaBitmap>
	floorHeight: number
	cellingTexture: Either<RgbaBitmap>
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
	player: Either<Thing> // TODO why player is  Either?
	flatBySector: FlatBySector[]
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
}

/** Flats for a given sector.  */
export type FlatBySector = LinedefBySector & {
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
 * Sprites are graphics used for Things, for example: gun, monster, pickup, power up.
 *
 * Directory Name not only provides name for the Sprite, but also info about animation frames and rotation: first 4-characters are the
 * Sprite's name, 5-th character is the frame number for animation (A-Z), following characters define rotation.
 * Example: SHTGA0,SHTGB0,SHTGAC0 -> Sprite SHTG, single rotation 0, 3 frames: A, B, C.
 *
 * Some sprites can have mirrored image, for example: SARGC3C7 -> this represents two frames: SARGC3 and SARGC7 as mirror image of the
 * first one.
 *
 * Each sprite consists of multiple directories, where each one provides info for a single frame.
 *
 * @see https://doomwiki.org/wiki/Sprite
 * @see https://zdoom.org/wiki/Sprite
 * @see doc/dmspec16.txt -> CHAPTER [5]: Graphics
 */
export type Sprite = {

	/** 4 character upper case name of sprite. */
	name: string,

	/**
	 * K: frame name, ASCII: A-Z
	 * V: frames for different rotations/angles. Eventually this list contains only one element,
	 * 		if this frame has only one angle.
	 */
	frames: Record<string, Frame[]>,

	// max width/height for any frame
	maxWidth: number
	maxHeight: number
}

export type Frame = {
	/** Sprite dir, like: TROOA2A8 or TROOA3A7 */
	dir: Directory,

	/** Frame name, ASCII: A-Z */
	frameName: string,

	/** 4-character name */
	spriteName: string,

	/**
	 *        3
	 *       4 | 2
	 *        \|/
	 *      5--*----> 1   Thing is facing this direction
	 *        /|\
	 *       6 | 8
	 *         7
	 */
	rotation: number,
	bitmap: Bitmap,
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
}

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
	flatBitmaps: RgbaBitmap[],
	sprites: Record<string, Sprite>,

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

const vertexNear = (v1: Vertex, v2: Vertex): boolean => Math.abs(v1.x - v2.x) <= MC.vertex.near && Math.abs(v1.y - v2.y) <= MC.vertex.near

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
	R.uniqWith<Vertex>((v1, v2) => v1.x === v2.x && v1.y === v2.y)(R.flatten(vectors.map(v => [v.start, v.end])))

const hasVertex = (vertex: Vertex) => (vector: VectorV): boolean =>
	vertexEqual(vertex, vector.start) || vertexEqual(vertex, vector.end)

const vectorReversed = (vectors: VectorV[]) => (ve: VectorV): boolean =>
	!vectors.find(v => {
		const con = vectorsConnected(ve, v)
		return con === VectorConnection.V1END_TO_V2START || con === VectorConnection.V1START_TO_V2END ? v : undefined
	})

const vectorsConnected = (v1: VectorV, v2: VectorV): VectorConnection => R.cond([
	[(v1, v2) => vertexNear(v1.start, v2.end), () => VectorConnection.V1START_TO_V2END],
	[(v1, v2) => vertexNear(v1.start, v2.start), () => VectorConnection.V1START_TO_V2START],
	[(v1, v2) => vertexNear(v1.end, v2.start), () => VectorConnection.V1END_TO_V2START],
	[(v1, v2) => vertexNear(v1.end, v2.end), () => VectorConnection.V1END_TO_V2END],
	[R.T, () => VectorConnection.NONE]
])(v1, v2)

const reversed = (con: VectorConnection) => con === VectorConnection.V1START_TO_V2START || con === VectorConnection.V1END_TO_V2END

const countVertex = (vectors: VectorV[]) => (vertex: Vertex) =>
	R.reduce<VectorV, number>((acc, v) => hasVertex(vertex)(v) ? ++acc : acc, 0, vectors)

const uniqueVertex = (vectors: VectorV[]): Vertex[] => {

	// collect all Vertex from #vectors int list
	const vertexes = R.flatten(vectors.map(v => [v.start, v.end]))

	// remove duplicates
	return R.uniqWith(vertexEqual, vertexes)
}

const uniqueVector = <V extends VectorV>(vectors: V[]): V[] => R.uniqWith(vectorsEqual, vectors)

const hasNoVector = <V extends VectorV>(points: Vertex[]) => (vector: V): boolean => !hasVector(points)(vector)

/**
 * @return true, if both points of the given vector are in a given list of points.
 */
const hasVector = <V extends VectorV>(points: Vertex[]) => (vector: V): boolean =>
	points.find(v => vertexEqual(v, vector.start)) !== undefined && points.find(v => vertexEqual(v, vector.end)) !== undefined

const hasNoAction = (v: VectorV): boolean => !hasAction(v)
const hasAction = (v: VectorV): boolean => !R.isNil(v.specialType) && v.specialType !== 0

const filterActions = <V extends VectorV>(vectors: V[]): V[] => vectors.filter(hasNoAction)

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

// based on https://wrfranklin.org/Research/Short_Notes/pnpoly.html
const containsVertex = (poly: Vertex[]) => (vertex: Vertex): boolean => {
	let inside = false
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		if (((poly[i].y > vertex.y) != (poly[j].y > vertex.y)) &&
			(vertex.x < (poly[j].x - poly[i].x) * (vertex.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)) {
			inside = !inside
		}
	}
	return inside
}

// ############################ EXPORTS ############################
export const testFunctions = {}

export const functions = {
	findMinX,
	findMaxX,
	findMinY,
	findMaxY,
	findMax,
	vertexEqual,
	reverseVector,
	pathToPoints,
	hasVertex,
	vectorsConnected,
	vectorReversed,
	countVertex,
	uniqueVertex,
	toSimpleVectors,
	toSimpleVector,
	stringifyVectors,
	stringifyVector,
	reversed,
	vectorsEqual,
	hasVector,
	uniqueVector,
	hasNoAction,
	hasAction,
	filterActions,
	vertexNear,
	hasNoVector,
	stringifyVertex,
	containsVertex,
}
