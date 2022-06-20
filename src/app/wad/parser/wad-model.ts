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

	/** Lump's name. Map contains of few predefined Lumps (MapLumpType), but there are also types of Lumps. */
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
	S_END = 'S_END',
	PNAMES = 'PNAMES'
}

/**
 * Names of static directories
 */
export enum TextureDir {
	TEXTURE1 = 'TEXTURE1',
	TEXTURE2 = 'TEXTURE2'
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
	idx: number
	colors: RGBA[]
};

export type RGBA = {
	r: number,
	g: number,
	b: number,
	a: number
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
 * Linedef represents single wall on the map. Wall is more like a line between #start and #end. Textures for the wall are defined by
 * Sidedef. A few Linedef with the same #sectorTag belong to the same Sector, which makes up a closed space - a room. Sector defines
 * textures for flor and celling, height of the celling and lighting in this Sector (room)
 *
 * @see https://doomwiki.org/wiki/Linedef
 */
export type Linedef = MapLump & {
	id: number
	start: Vertex
	end: Vertex
	flags: Set<LinedefFlag>
	specialType: number
	sectorTag: number
	sector: Sector
	frontSide: Sidedef
	backSide: Either<Sidedef>
};

/**
 * @see https://doomwiki.org/wiki/Linedef#Linedef_flags
 */
export enum LinedefFlag {
	blocks_players_monsters = 1,
	blocks_monsters = 2,
	two_sided = 3,
	upper_texture_unpegged = 4,
	lower_texture_unpegged = 5,
	secret = 6,
	blocks_sound = 7,
	never_shows_on_automap = 8,
	always_shows_on_automap = 9
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
	 * The name of a texture that will be displayed on the border between a sectorId and its neighboring ceiling of a different
	 * height. If the linedef that contains this sidedef is one-sided this field is meaningless.
	 */
	upperTexture: Either<DoomTexture>

	/**
	 * On one sided linedefs this will be the only texture displayed; as the main wall texture. On two sided linedefs this will be displayed
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

	sector: Sector
};

/**
 * A Sector is an area defined by a few Sidedef (wall) building a room. Each Sector has a height of the celling, texture on celling and
 * flor, and lighting.
 *
 * @see https://doomwiki.org/wiki/Sector
 */
export type Sector = MapLump & {
	id: number
	floorHeight: number
	ceilingHeight: number
	floorTexture: string
	cellingTexture: string
	lightLevel: number
	specialType: number
	tagNumber: number

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
export type DoomMap = {
	mapDirs: Directory[]
	things: Thing[]

	linedefBySector: LinedefBySector[]
	sectors: Sector[]
	linedefs: Linedef[]
};

/** Front side Linedefs by Sector */
export type LinedefBySector = {
	sector: Sector
	linedefs: Linedef[]
}

export enum WadType {
	IWAD,
	PWAD
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
};

/**
 * Bitmap column (known as post) of Doom's bitmap. Offset to each columns is given by BitmapHeader#columnofs
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
export type Bitmap = RgbaBitmap & {
	header: BitmapHeader

	/** Picture in Doom format consists of columns (x-axis) going downward on the screen (y-axis). */
	columns: Either<Column>[]

	rgba: Uint8ClampedArray
};

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
};

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

	/** Patch name from PNAMES. */
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
};

export type Wad = {
	header: Header,
	title: TitlePic,
	maps: DoomMap[],
	dirs: Directory[],
	pnames: Pnames,
	patches: Bitmap[]
	bytes: number[],
	playpal: Playpal,
	textures: DoomTexture[]
};

export type WadEntry = {
	wad: Wad;
	name: string;
	gameSave: GameSave[];
};

export type GameSave = {
	name: string;
};
