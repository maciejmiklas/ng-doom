/*
 * Copyright 2022 Maciej Miklas (MIT License)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import * as R from 'ramda'
import {Either, LeftType} from '../../common/either'
import {
	Directory,
	DoomMap,
	DoomTexture,
	FlatBySector,
	functions as MF,
	Linedef,
	LinedefBySector,
	LinedefFlag,
	MapLumpType,
	RgbaBitmap,
	Sector,
	Sidedef,
	Thing,
	ThingType,
	ThingTypes,
	VectorConnection,
	VectorV,
	Vertex
} from './wad-model'
import U from '../../common/util'
import {Log} from "../../common/log"
import {functions as FB} from "./flat-builder"
import {config as WC} from "../wad-config"
import {thingTypes} from "./things"

const CMP = 'MP'

const findLastNotConnected = (linedefs: VectorV[]): Either<number> => {
	const next = U.nextRoll(linedefs)

	// @ts-ignore
	// add #idx to R.findLastIndex: (el) => (el, idx)
	const findWithIndex = R.addIndex<VectorV>(R.findLastIndex)

	// go over list from last element and compare it with previous element until you find not connected vectors
	const foundIdx: number = findWithIndex((el, idx) =>
		MF.vectorsConnected(el, next(linedefs.length - idx)) === VectorConnection.NONE)(linedefs)

	return Either.ofCondition(() => foundIdx > 0, () => 'Vectors connected', () => foundIdx)
}

/** The type of the map has to be in the form ExMy or MAPxx */
const isMapName = (name: string): boolean =>
	!R.isNil(name) && name.length > 4 && name.startsWith('MAP') || (name.charAt(0) === 'E' && name.charAt(2) === 'M')

/** Finds next map in directory */
const findNextMapStartingDir = (dirs: Directory[]) => (dirOffset: number): Either<Directory> =>
	U.findFrom(dirs)(dirOffset, (d, idx) => isMapName(d.name))

/** fins all starting dirs for all maps. */
const findAllMapStartDirs = (dirs: Directory[]): Directory[] => {
	const findNext = findNextMapStartingDir(dirs)
	return R.unfold((dirIdx: number) => findNext(dirIdx).mapGet(msg => false, d => [d, d.idx + 1]), 1)
}

/** parse all dir for single map */
const parseMapDirs = (dirs: Directory[]) => (mapDir: Directory): Either<Directory[]> => {
	const mapDirs: Directory[] = R.slice(mapDir.idx, mapDir.idx + MapLumpType.BLOCKMAP + 1, dirs)
	return Either.ofCondition(
		() =>
			mapDirs.length === MapLumpType.BLOCKMAP + 1 &&
			mapDirs[MapLumpType.MAP_NAME].name === mapDir.name &&
			mapDirs[MapLumpType.THINGS].name === 'THINGS' &&
			mapDirs[MapLumpType.LINEDEFS].name === 'LINEDEFS' &&
			mapDirs[MapLumpType.SIDEDEFS].name === 'SIDEDEFS' &&
			mapDirs[MapLumpType.SEGS].name === 'SEGS' &&
			mapDirs[MapLumpType.SSECTORS].name === 'SSECTORS' &&
			mapDirs[MapLumpType.NODES].name === 'NODES' &&
			mapDirs[MapLumpType.SECTORS].name === 'SECTORS' &&
			mapDirs[MapLumpType.REJECT].name === 'REJECT' &&
			mapDirs[MapLumpType.BLOCKMAP].name === 'BLOCKMAP',
		() => 'Incorrect map folders: ' + mapDir + ' -> ' + mapDirs, () => mapDirs)
}

const parseMapsDirs = (allDirs: Directory[], startMapDirs: Directory[]): Directory[][] =>
	R.mapAccum((acc, dir) =>
		[acc, parseMapDirs(allDirs)(dir).orElse(() => null)], [], startMapDirs)[1].filter(R.isNotNil)

const createTextureLoader = (textures: DoomTexture[]) => (name: string): Either<DoomTexture> =>
	Either.ofNullable(textures.find(t => U.cs(t.name, name)), () => 'Texture not found: ' + name, LeftType.WARN)

const createFlatLoader = (flats: RgbaBitmap[]) => (name: string): Either<RgbaBitmap> =>
	Either.ofNullable(flats.find(t => U.cs(t.name, name)), () => 'Flat not found: ' + name, LeftType.WARN)

const parseMaps = (bytes: number[], dirs: Directory[], textures: DoomTexture[], flats: RgbaBitmap[]): Either<DoomMap[]> => {
	const textureLoader = createTextureLoader(textures)
	const flatLoader = createFlatLoader(flats)
	return Either.ofArray(parseMapsDirs(dirs, findAllMapStartDirs(dirs))
		.map(parseMap(bytes, textureLoader, flatLoader)), () => 'No maps found')
}

const parseMap = (bytes: number[], textureLoader: (name: string) => Either<DoomTexture>, flatLoader: (name: string) => Either<RgbaBitmap>) => (mapDirs: Directory[]): DoomMap => {
	const mapName = mapDirs[0].name
	Log.info(CMP, 'Parse Map: ', mapName)
	const sectors = parseSectors(bytes)(mapDirs, flatLoader)
	const linedefs = parseLinedefs(bytes, mapDirs,
		parseVertexes(bytes)(mapDirs),
		parseSidedefs(bytes, textureLoader)(mapDirs, sectors), sectors)
	const flatBySector = buildFlatsBySectors(linedefs, sectors)
	const things = parseThings(bytes, mapDirs, flatBySector)
	const playerArr = things.filter(th => th.thingTypeId == ThingTypes.PLAYER)
	return {
		mapName,
		mapDirs,
		things,
		player: Either.ofCondition(() => playerArr.length > 0,
			() => 'Map without player!', () => playerArr[0], LeftType.WARN),
		linedefs,
		sectors,
		flatBySector,
		sky: textureLoader(WC.sky.textureName)
	}
}

/** group Linedef by Sector */
const groupBySectorArray = (linedefs: Linedef[]): Linedef[][] => {
	const sorted = R.sortBy((ld: Linedef) => ld.sector.id)(linedefs) // sort by #sector.id in order to be able to group by it
	return R.groupWith((a: Linedef, b: Linedef) => a.sector.id === b.sector.id, sorted)
}

/** Linedef[0] contains wall elements, Linedef[1] contains actions. */
const groupByWallAndAction = (linedefs: Linedef[]): Linedef[][] => {
	const grouped = R.groupBy<Linedef>(ld => ld.specialType == 0 ? 'W' : 'A', linedefs)
	const walls = grouped['W']
	const actions = grouped['A']
	return [U.nullSafeArray(walls), U.nullSafeArray(actions)]
}

const findMaxSectorId = (linedefs: Linedef[]): number => R.reduce<number, number>(R.max, 0, linedefs.map(ld => ld.sector.id))

const groupLinedefsBySector = (mapLinedefs: Linedef[], backLinedefs: Linedef[]) => (sector: Sector): Either<LinedefBySector> => {
	const linedefs: Linedef[] = mapLinedefs.filter(ld => ld.sector.id === sector.id)
		// for two sectors sharing common border vectors are defined only in one of those sectors as a backside
		.concat(findBacksidesBySector(backLinedefs)(sector.id).orElse(() => []))

	if (linedefs.length === 0) {
		return Either.ofLeft(() => 'No Linedefs for sector: ' + sector.id, LeftType.WARN)
	}

	// split Linedefs into those building walls and actions, as the actions are selten a part of the wall
	const linedefsByAction = groupByWallAndAction(linedefs)
	return Either.ofRight(({
		sector,
		linedefs,
		actions: linedefsByAction[1],
	}))
}

const buildFlatsForSector = (lbs: LinedefBySector): Either<FlatBySector> => {
	const flatFactory = FB.createFlat(lbs.sector)
	return flatFactory(lbs.linedefs).map(flat => ({
		...lbs,
		flat
	}))
}

const buildFlatsBySectors = (mapLinedefs: Linedef[], sectors: Sector[]): FlatBySector[] => {
	const maxSectorId = findMaxSectorId(mapLinedefs)
	const bySector = groupLinedefsBySector(mapLinedefs, findBackLinedefs(mapLinedefs))

	// array contains #maxSectorId elements each increased by 1
	return R.unfold((sectorId: number) => sectorId > maxSectorId ? false : [sectorId++, sectorId++], 0)

		// map each #sectorId to Sector
		.map(sectorId =>
			Either.ofNullable(sectors.find(s => s.id === sectorId), () => 'No Sector: ' + sectorId)
		)

		// remove not existing sectors from array
		.filter(s => s.filter())

		// Either<Sector> => Sector
		.map(s => s.get())

		// Sector => Either<LinedefBySector>
		.map(s => bySector(s).map(buildFlatsForSector))

		// remove not existing LinedefBySector from array
		.filter(ld => ld.filter())

		// Either<LinedefBySector> => LinedefBySector
		.map(s => s.get())
}

/**
 * @param dir Directory
 * @param size size of directory in bytes, for example Thing: "Level thing data is stored in the THINGS lump. Each entry is 10 bytes long."
 */
const unfoldByDirectorySize = (dir: Directory, size: number): number[] =>
	R.unfold((idx) => idx === dir.size / size ? false : [dir.filepos + idx * 10, idx + 1], 0)

const parseThing = (bytes: number[], thingDir: Directory, flats: FlatBySector[]) => (thingIdx: number): Either<Thing> => {
	const offset = thingDir.filepos + 10 * thingIdx
	const shortParser = U.parseInt16(bytes)
	const position = {
		x: shortParser(offset),
		y: shortParser(offset + 2),
	}
	const thingTypeId = shortParser(offset + 6)
	const type = findThingType(thingTypeId)
	const sector = findSectorByVertex(flats)(position)
	return Either.ofTruth([sector, type], () => ({
		dir: thingDir,
		position,
		angleFacing: shortParser(offset + 4),
		lumpType: MapLumpType.THINGS,
		thingTypeId,
		type: type.get(),
		flags: shortParser(offset + 8),
		sector: sector.get()
	}))
}

const findThingType = (id: number): Either<ThingType> => Either.ofNullable(thingTypes[id],
	() => 'Thing Type: ' + id + ' not found', LeftType.WARN)

const containsVertex = (polygons: Vertex[][], pos: Vertex): boolean => {
	return polygons.filter(po => MF.containsVertex(po)(pos)).length > 0
}

const findSectorByVertex = (flats: FlatBySector[]) => (pos: Vertex): Either<Sector> => {
	const found = flats.filter(fl => containsVertex(fl.flat.wallsPolygon, pos)).map(se => se.sector)
	return Either.ofCondition(() => found.length > 0, () => 'Vertex not in polygons', () => found[0])
}

const parseThings = (bytes: number[], mapDirs: Directory[], flats: FlatBySector[]): Thing[] => {
	const thingDir = mapDirs[MapLumpType.THINGS]
	const parser = parseThing(bytes, thingDir, flats)
	return unfoldByDirectorySize(thingDir, 10).map((ofs, thingIdx) => parser(thingIdx))
		.filter(th => th.filter()).map(th => th.get()).map(th => th)
}

const parseSector = (bytes: number[], dir: Directory, flatLoader: (name: string) => Either<RgbaBitmap>) => (thingIdx: number): Sector => {
	const offset = dir.filepos + 26 * thingIdx
	const shortParser = U.parseInt16(bytes)
	const strParser = U.parseStr(bytes)
	return {
		dir,
		lumpType: MapLumpType.SECTORS,
		floorHeight: shortParser(offset),
		cellingHeight: shortParser(offset + 0x02),
		floorTexture: flatLoader(strParser(offset + 0x04, 8)),
		cellingTexture: flatLoader(strParser(offset + 0x0C, 8)),
		lightLevel: shortParser(offset + 0x14),
		specialType: shortParser(offset + 0x16),
		tagNumber: shortParser(offset + 0x18),
		id: thingIdx,
	}
}

const parseSectors = (bytes: number[]) => (mapDirs: Directory[], flatLoader: (name: string) => Either<RgbaBitmap>): Sector[] => {
	const sectorsDir = mapDirs[MapLumpType.SECTORS]
	const parser = parseSector(bytes, sectorsDir, flatLoader)
	return unfoldByDirectorySize(sectorsDir, 26).map((ofs, thingIdx) => parser(thingIdx))
}

const parseSidedef = (bytes: number[], dir: Directory, textureLoader: (name: string) => Either<DoomTexture>, sectors: Sector[]) => (thingIdx: number): Either<Sidedef> => {
	const offset = dir.filepos + 30 * thingIdx
	const shortParser = U.parseInt16(bytes)
	const strOpParser = U.parseTextureName(bytes)
	const sectorId = shortParser(offset + 0x1C)
	return Either.ofCondition(
		() => sectorId < sectors.length && sectorId >= 0,
		() => 'Sector ' + sectorId + ' has no Sidedef on ' + thingIdx,
		() => ({
			dir,
			lumpType: MapLumpType.SIDEDEFS,
			offset: {
				x: shortParser(offset),
				y: shortParser(offset + 2),
			},
			upperTexture: strOpParser(offset + 0x04, 8).map(textureLoader),
			lowerTexture: strOpParser(offset + 0x0C, 8).map(textureLoader),
			middleTexture: strOpParser(offset + 0x14, 8).map(textureLoader),
			sector: sectors[shortParser(offset + 0x1C)]
		}))
}

const parseSidedefs = (bytes: number[], textureLoader: (name: string) => Either<DoomTexture>) => (mapDirs: Directory[], sectors: Sector[]): Either<Sidedef>[] => {
	const thingDir = mapDirs[MapLumpType.SIDEDEFS]
	const parser = parseSidedef(bytes, thingDir, textureLoader, sectors)
	return unfoldByDirectorySize(thingDir, 30) //Each Sidedef is 30 bytes large
		.map((ofs, thingIdx) => parser(thingIdx))
}

const parseLinedefs = (bytes: number[], mapDirs: Directory[], vertexes: Vertex[], sidedefs: Either<Sidedef>[], sectors: Sector[]): Linedef[] => {
	const linedefsDir = mapDirs[MapLumpType.LINEDEFS]
	const parser = parseLinedef(bytes, linedefsDir, vertexes, sidedefs, sectors)
	return unfoldByDirectorySize(linedefsDir, 14) // Linedef has 14 bytes
		.map((ofs, thingIdx) => parser(thingIdx))// thingIdx => Either<Linedef>
		.filter(v => v.filter()).map(v => v.get()) // Either<Linedef> => Linedef
}

const parseFlags = (val: number): Set<LinedefFlag> =>
	new Set<LinedefFlag>(
		Object.keys(LinedefFlag) // iterate over all entries from LinedefFlag
			.map(Number).filter(k => !isNaN(k)) // map keys: LinedefFlag => number
			.filter(k => (1 << (k - 1) & val) != 0)// remove not set bits
	)

const parseLinedef = (bytes: number[], dir: Directory, vertexes: Vertex[], sidedefs: Either<Sidedef>[], sectors: Sector[]) => (linedefId: number): Either<Linedef> => {
	const offset = dir.filepos + 14 * linedefId
	const shortParser = U.parseInt16(bytes)
	const intParser = U.parseInt32(bytes)
	const shortOpParser = U.parseInt16Op(bytes)

	const vertexParser = shortOpParser(v => v < vertexes.length && v >= 0,
		v => 'Vertex out of bound: ' + v + ' of ' + vertexes.length + ' on ' + offset)

	const startVertex = vertexParser(offset).map(idx => vertexes[idx])
	const endVertex = vertexParser(offset + 2).map(idx => vertexes[idx])

	//TODO v === -1 is OK, but  v>=sidedefs.length is WARN
	const parseSide = shortOpParser(v => v < sidedefs.length && v >= 0,
		v => 'Sidedef out of bound: ' + v + ' < ' + sidedefs.length + ' on ' + offset)

	const frontSide = parseSide(offset + 10).map(idx => sidedefs[idx])
	const backSide = parseSide(offset + 12).map(idx => sidedefs[idx])

	const sector = frontSide.map(fs => Either.ofCondition(() => fs.sector.id >= 0 && fs.sector.id < sectors.length,
		() => 'No Sector for Linedef: ' + linedefId, () => sectors[fs.sector.id], LeftType.WARN))

	return Either.ofTruth([startVertex, endVertex, frontSide, sector], () =>
		({
			id: linedefId,
			dir,
			lumpType: MapLumpType.LINEDEFS,
			start: startVertex.get(),
			end: endVertex.get(),
			flags: parseFlags(intParser(offset + 0x04)),
			specialType: shortParser(offset + 0x06),
			sectorTag: shortParser(offset + 0x08),
			frontSide: frontSide.get(),
			backSide,
			sector: sector.get()
		}))
}

const parseVertex = (bytes: number[], vertexDir: Directory) => (thingIdx: number): Vertex => {
	const offset = vertexDir.filepos + 4 * thingIdx
	const shortParser = U.parseInt16(bytes)
	return {
		x: shortParser(offset),
		y: shortParser(offset + 0x02),
	}
}

const parseVertexes = (bytes: number[]) => (mapDirs: Directory[]): Vertex[] => {
	const vertexDir = mapDirs[MapLumpType.VERTEXES]
	const parser = parseVertex(bytes, vertexDir)
	return unfoldByDirectorySize(vertexDir, 4).map((ofs, thingIdx) => parser(thingIdx))
}

const scalePos = (scale: number) => (min: number) => (pos: number): number => {
	return Math.round((pos + min) / scale)
}

const normalizeLinedefs = (scale: number) => (linedefs: Linedef[]): Linedef[] => {
	const minX = Math.abs(MF.findMinX(linedefs))
	const minY = Math.abs(MF.findMinY(linedefs))
	const scaleFunc = scalePos(scale)
	const scaleX = scaleFunc(minX)
	const scaleY = scaleFunc(minY)
	return R.map(ld => {
		const nld = {...ld}
		nld.start = {x: scaleX(ld.start.x), y: scaleY(ld.start.y)}
		nld.end = {x: scaleX(ld.end.x), y: scaleY(ld.end.y)}
		return nld
	}, linedefs)
}

const findBackLinedefs = (linedefs: Linedef[]): Linedef[] => linedefs.filter(ld => ld.backSide.isRight())

const findBacksidesBySector = (backLinedefs: Linedef[]) => (sectorId: number): Either<Linedef[]> =>
	Either.ofArray(backLinedefs.filter(ld => ld.backSide.get().sector.id == sectorId),
		() => 'No backsides for Sector: ' + sectorId)

// ############################ EXPORTS ############################
export const testFunctions = {
	isMapName,
	findNextMapStartingDir,
	parseThing,
	parseThings,
	parseVertex,
	parseVertexes,
	parseLinedef,
	parseLinedefs,
	parseSidedef,
	parseSidedefs,
	parseMapDirs,
	parseMap,
	findAllMapStartDirs,
	parseMapsDirs,
	scalePos,
	parseSector,
	parseSectors,
	buildFlatsBySectors,
	createTextureLoader,
	groupBySectorArray,
	parseFlags,
	createFlatLoader,
	findBacksidesBySector,
	findLastNotConnected,
	findBackLinedefs,
	findMaxSectorId,
	findThingType
}

export const functions = {parseMaps, normalizeLinedefs}
