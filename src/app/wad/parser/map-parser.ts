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
import * as R from 'ramda'
import {Either, LeftType} from '../../common/either'
import {
	Bitmap,
	Directory,
	DoomMap,
	DoomTexture,
	functions as mf,
	Linedef,
	LinedefBySector,
	LinedefFlag,
	MapLumpType,
	Sector,
	Sidedef,
	Thing,
	ThingType,
	VectorConnection,
	VectorV,
	Vertex
} from './wad-model'
import U from '../../common/util'
import {Log} from "../../common/log"
import {functions as FB} from "./flat-builder"
import {config as WC} from "../wad-config"

const CMP = 'MPA'

const findLastNotConnected = (linedefs: VectorV[]): Either<number> => {
	const next = U.nextRoll(linedefs)

	// @ts-ignore
	// add #idx to R.findLastIndex: (el) => (el, idx)
	const findWithIndex = R.addIndex<VectorV>(R.findLastIndex)

	// go over list from last element and compare it with previous element until you find not connected vectors
	const foundIdx: number = findWithIndex((el, idx) =>
		mf.vectorsConnected(el, next(linedefs.length - idx)) === VectorConnection.NONE)(linedefs)

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
		[acc, parseMapDirs(allDirs)(dir).orElse(() => null)], [], startMapDirs)[1].filter(v => !R.isNil(v))

const createTextureLoader = (textures: DoomTexture[]) => (name: string): Either<DoomTexture> =>
	Either.ofNullable(textures.find(t => U.cs(t.name, name)), () => 'Texture not found: ' + name, LeftType.WARN)

const createFlatLoader = (flats: Bitmap[]) => (name: string): Either<Bitmap> =>
	Either.ofNullable(flats.find(t => U.cs(t.name, name)), () => 'Flat not found: ' + name, LeftType.WARN)

const parseMaps = (bytes: number[], dirs: Directory[], textures: DoomTexture[], flats: Bitmap[]): Either<DoomMap[]> => {
	const textureLoader = createTextureLoader(textures)
	const flatLoader = createFlatLoader(flats)
	return Either.ofArray(parseMapsDirs(dirs, findAllMapStartDirs(dirs)).map(parseMap(bytes, textureLoader, flatLoader)), () => 'No maps found')
}

const parseMap = (bytes: number[], textureLoader: (name: string) => Either<DoomTexture>, flatLoader: (name: string) => Either<Bitmap>) => (mapDirs: Directory[]): DoomMap => {
	const mapName = mapDirs[0].name
	Log.info(CMP, 'Parse Map: ', mapName)
	const sectors = parseSectors(bytes)(mapDirs, flatLoader)
	const linedefs = parseLinedefs(bytes, mapDirs, parseVertexes(bytes)(mapDirs), parseSidedefs(bytes, textureLoader)(mapDirs, sectors), sectors)
	const things = parseThings(bytes)(mapDirs)
	const playerArr = things.filter(th => th.thingType == ThingType.PLAYER);
	return {
		mapName,
		mapDirs,
		things,
		player: Either.ofCondition(() => playerArr.length > 0, () => 'Map without player!', () => playerArr[0], LeftType.WARN),
		linedefs,
		sectors,
		linedefBySector: groupLinedefsBySectors(linedefs, sectors),
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
		return Either.ofLeft(() => 'No Linedefs for sector: ' + sector.id)
	}

	// split Linedefs into those building walls and actions, as the actions are selten a part of the wall
	const linedefsByAction = groupByWallAndAction(linedefs)
	const flatFactory = FB.createFlat(sector)
	return flatFactory(linedefs).map(flat => ({
		sector,
		linedefs,
		actions: linedefsByAction[1],
		flat
	}))
}

const groupLinedefsBySectors = (mapLinedefs: Linedef[], sectors: Sector[]): LinedefBySector[] => {
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
		.map(s => bySector(s))

		// remove not existing LinedefBySector from array
		.filter(ld => ld.filter())

		//Either<LinedefBySector> => LinedefBySector
		.map(s => s.get())
}

const unfoldByDirectorySize = (dir: Directory, size: number): number[] =>
	R.unfold((idx) => idx === dir.size / size ? false : [dir.filepos + idx * 10, idx + 1], 0)

const parseThing = (bytes: number[], thingDir: Directory) => (thingIdx: number): Thing => {
	const offset = thingDir.filepos + 10 * thingIdx
	const shortParser = U.parseInt16(bytes)
	return {
		dir: thingDir,
		position: {
			x: shortParser(offset),
			y: shortParser(offset + 2),
		},
		angleFacing: shortParser(offset + 4),
		lumpType: MapLumpType.THINGS,
		thingType: shortParser(offset + 6),
		flags: shortParser(offset + 8),
	}
}

const parseThings = (bytes: number[]) => (mapDirs: Directory[]): Thing[] => {
	const thingDir = mapDirs[MapLumpType.THINGS]
	const parser = parseThing(bytes, thingDir)
	return unfoldByDirectorySize(thingDir, 10).map((ofs, thingIdx) => parser(thingIdx)).map(th => th)
}

const parseSector = (bytes: number[], dir: Directory, flatLoader: (name: string) => Either<Bitmap>) => (thingIdx: number): Sector => {
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

const parseSectors = (bytes: number[]) => (mapDirs: Directory[], flatLoader: (name: string) => Either<Bitmap>): Sector[] => {
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

const parseLinedef = (bytes: number[], dir: Directory, vertexes: Vertex[], sidedefs: Either<Sidedef>[], sectors: Sector[]) => (linedeefId: number): Either<Linedef> => {
	const offset = dir.filepos + 14 * linedeefId
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
		() => 'No Sector for Linedef: ' + linedeefId, () => sectors[fs.sector.id], LeftType.WARN))

	return Either.ofTruth([startVertex, endVertex, frontSide, sector], () =>
		({
			id: linedeefId,
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
	const minX = Math.abs(mf.findMinX(linedefs))
	const minY = Math.abs(mf.findMinY(linedefs))
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
	groupLinedefsBySectors,
	createTextureLoader,
	groupBySectorArray,
	parseFlags,
	createFlatLoader,
	findBacksidesBySector,
	findLastNotConnected,
	findBackLinedefs,
	findMaxSectorId
}

export const functions = {parseMaps, normalizeLinedefs}
