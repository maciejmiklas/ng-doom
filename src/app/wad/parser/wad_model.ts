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

/** A WAD file always starts with a 12-byte header. */
import {Either} from '@maciejmiklas/functional-ts';

export type Header = {
	identification: WadType

	/** Number of lumps in WAD. */
	numlumps: number

	/** Offset in WAD to the location of the directory. */
	infotableofs: number
};

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

	/** Lump's name. Map contains of few predefined Lumps (MapLumpType), but there are also other types of Lumps */
	name: string
};

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
	S_END = 'S_END'
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
 * Lump is a abstract data type found in each map.
 * Each Lump definition starts with Directory containing type of the Lump and pointer to Lump's data in WAD.
 */
export type Lump = {
	dir: Directory
};

/**
 * @see https://doomwiki.org/wiki/PLAYPAL
 */
export type Playpal = Lump & {
	palettes: Palette[]
};

export type Palette = {
	colors: RGB[]
};

export type RGB = {
	r: number,
	g: number,
	b: number
};

/**
 * Lump is a abstract data type found in each map.
 * Each Lump definition starts with Directory containing type of the Lump and pointer to Lump's data in WAD.
 */
export type MapLump = Lump & {
	type: MapLumpType
};

/** range from -32768 to +32767 */
export type Position = {
	x: number,
	y: number
};

/**
 * Things represent monsters, pick-ups, and projectiles.
 *
 * see: https://doomwiki.org/wiki/Thing
 */
export type Thing = MapLump & {
	position: Position
	angleFacing: number,
	type: number,
	flags: number
};

/**
 * Position on the map. WAD contains list of all possible positions stored in Lump: VERTEXES.
 * SIDEDEFS contains list of walls on particular map, where each wall references two Vertex, as it's start and end
 * position on the map.
 *
 * @see https://doomwiki.org/wiki/Vertex
 */
export type Vertex = Position & {
	// empty
};

/**
 * Linedef represents single wall on the map.
 * @see https://doomwiki.org/wiki/Linedef
 */
export type Linedef = MapLump & {
	start: Vertex
	end: Vertex
	flags: number
	specialType: number
	sectorTag: number
	frontSide: Sidedef
	backSide: Either<Sidedef>
};

/**
 * Sidedef contains textures for each wall on the map (Linedef)
 *
 * @see https://doomwiki.org/wiki/Sidedef
 */
export type Sidedef = MapLump & {
	offset: Position
	upperTexture: Either<string>
	lowerTexture: Either<string>
	middleTexture: Either<string>
	sector: number
};

export type Vertexe = MapLump & {
	xxx: number
};

export type Seg = MapLump & {
	xxx: number
};

export type Ssector = MapLump & {
	xxx: number
};

export type Node = MapLump & {
	xxx: number
};

export type Sector = MapLump & {
	xxx: number
};

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
export type Map = {
	nameDir: Directory
	things: Thing[]
	linedefs: Linedef[]
	sidedefs: Sidedef[]
	vertexes: Vertexe[]
	segs: Seg[]
	ssectors: Ssector[]
	nodes: Node[]
	sectors: Sector[]
};

export enum WadType {
	IWAD,
	PWAD
}

/**
 * Header of Doom Picture (Patch)
 * @see https://doomwiki.org/wiki/Picture_format
 */
export type PatchHeader = {
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
};

/**
 * Bitmap column (known as post) of Doom's bitmap. Offset to each columns is given by PatchHeader#columnofs
 *
 * @see https://doomwiki.org/wiki/Picture_format -> Posts
 */
export type Post = {

	/** vertical (y) offset of this post in patch. */
	topdelta: number

	/**
	 * Array of pixels is this post. Length is given by #length.
	 * Each pixel has value 0-255 and it's an index in Doom palate
	 */
	data: number[]

	/** Starting position in WAD of this Post */
	filepos: number
};

/**
 * Data of each column is divided into posts, which are lines going downward on the screen (columns).
 *
 * Each post has offset in pixels, that gives it's position in column. There could be gap between Posts - in
 * such case free pixels are transparent
 */
export type Column = {
	posts: Post[]
};

/**
 * Picture/bitmap in Doom's Patch format
 *
 * @see https://doomwiki.org/wiki/Picture_format
 * @see https://www.cyotek.com/blog/decoding-doom-picture-files
 */
export type PatchBitmap = {
	header: PatchHeader

	/** Picture in Doom format consists of columns (x-axis) going downward on the screen (y-axis) */
	columns: Column[]
};

/**
 * Title pictures from WAD
 *
 * @see https://doomwiki.org/wiki/Title_screen
 */
export type TitlePic = {
	help: Either<PatchBitmap[]>
	title: PatchBitmap,
	credit: PatchBitmap,
	mDoom: PatchBitmap
};

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
 * @see https://doomwiki.org/wiki/Sprite
 */
export type Sprite = Lump & {

	/** 4 character upper case name of sprite. */
	name: string,

	/** K: angle, V: frames for animation. */
	animations: Record<number, PatchBitmap[]>
};

export type Wad = {
	header: Header,
	title: TitlePic,
	maps: Map[],
	dirs: Directory[]
	bytes: number[]
};

