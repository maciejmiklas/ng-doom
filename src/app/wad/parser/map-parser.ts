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
import {Either} from '../../common/either'
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
	MIN_VECTOR_V,
	Sector,
	Sidedef,
	Thing,
	VectorConnection,
	VectorV,
	Vertex
} from './wad-model'
import U from '../../common/util'
import {Log} from "../../common/log"

const findCrossingVertex = (vectors: VectorV[]): Vertex[] => mf.uniqueVertex(vectors).filter(v => mf.countVertex(vectors)(v) > 3)

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
	Either.ofNullable(textures.find(t => t.name === name), () => 'DoomTexture not found: ' + name)

const createFlatLoader = (flats: Bitmap[]) => (name: string): Either<Bitmap> =>
	Either.ofNullable(flats.find(t => t.name === name), () => 'Flat not found: ' + name)

const parseMaps = (bytes: number[], dirs: Directory[], textures: DoomTexture[], flats: Bitmap[]): Either<DoomMap[]> => {
	const textureLoader = createTextureLoader(textures)
	const flatLoader = createFlatLoader(flats)
	return Either.ofArray(parseMapsDirs(dirs, findAllMapStartDirs(dirs)).map(parseMap(bytes, textureLoader, flatLoader)), () => 'No maps found')
}

const parseMap = (bytes: number[], textureLoader: (name: string) => Either<DoomTexture>, flatLoader: (name: string) => Either<Bitmap>) => (mapDirs: Directory[]): DoomMap => {
	Log.debug('Parse Map:', mapDirs[0].name)
	const sectors = parseSectors(bytes)(mapDirs, flatLoader)
	const linedefs = parseLinedefs(bytes, mapDirs, parseVertexes(bytes)(mapDirs), parseSidedefs(bytes, textureLoader)(mapDirs, sectors), sectors)
	return {
		mapDirs,
		things: parseThings(bytes)(mapDirs),
		linedefs,
		sectors,
		linedefBySector: groupLinedefsBySectors(linedefs, sectors)
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
const orderAndBuildPaths = (linedefs: Linedef[]): Either<Linedef[][]> => {
	if (linedefs.length == 0) {
		return Either.ofLeft(() => 'Cannot build Path - Linedef[] is empty')
	}

	// build paths from vectors
	const paths = buildPaths<Linedef>(linedefs)
	return Either.ofCondition(() => paths.length > 0 && mf.pathContinuos(paths[0]),
		() => 'Could not build path for Sector: ' + R.path([0, 'sector', 'id'], linedefs),
		() => paths)
}

const groupLinedefsBySector = (mapLinedefs: Linedef[], backLinedefs: Linedef[]) => (sector: Sector): Either<LinedefBySector> => {
	const linedefs: Linedef[] = mapLinedefs.filter(ld => ld.sector.id === sector.id)
		// for two sectors sharing common border vectors are defined only in one of those sectors as a backside
		.concat(findBacksidesBySector(backLinedefs)(sector.id).orElse(() => []))

	if (linedefs.length === 0) {
		return Either.ofLeft(() => 'No Linedefs for sector: ' + sector.id)
	}

	// split linedefs into those building walls and actions
	const linedefsByAction = groupByWallAndAction(linedefs)

	// build paths from vectors, first try to build path without action Linedefs
	return orderAndBuildPaths(linedefsByAction[0])

		// retry building path, this time use also action Linedefs
		.orAnother(() => orderAndBuildPaths(linedefs))

		// Either<Linedef[][]> => Either<LinedefBySector>
		.map(paths => {
			// sort paths, first is the main area, remaining are holes
			const pathsByHoles: Linedef[][] = sortByHoles(paths)
			return Either.ofRight({
				sector,
				linedefs,
				actions: linedefsByAction[1],
				flat: {
					sector,
					walls: pathsByHoles.shift(),
					holes: Either.ofCondition(() => pathsByHoles.length > 0, () => 'No holes', () => pathsByHoles)
				}
			})
		})
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
	const thingDir = mapDirs[MapLumpType.SECTORS]
	const parser = parseSector(bytes, thingDir, flatLoader)
	return unfoldByDirectorySize(thingDir, 26).map((ofs, thingIdx) => parser(thingIdx))
}

const parseSidedef = (bytes: number[], dir: Directory, textureLoader: (name: string) => Either<DoomTexture>, sectors: Sector[]) => (thingIdx: number): Either<Sidedef> => {
	const offset = dir.filepos + 30 * thingIdx
	const shortParser = U.parseInt16(bytes)
	const strOpParser = U.parseTextureName(bytes)
	const sectorId = shortParser(offset + 0x1C)
	return Either.ofCondition(
		() => sectorId < sectors.length && sectorId > 0,
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

const parseLinedef = (bytes: number[], dir: Directory, vertexes: Vertex[], sidedefs: Either<Sidedef>[], sectors: Sector[]) => (thingIdx: number): Either<Linedef> => {
	const offset = dir.filepos + 14 * thingIdx
	const shortParser = U.parseInt16(bytes)
	const intParser = U.parseInt32(bytes)
	const shortOpParser = U.parseInt16Op(bytes)

	const vertexParser = shortOpParser(v => v < vertexes.length && v >= 0,
		v => 'Vertex out of bound: ' + v + ' of ' + vertexes.length + ' on ' + offset)

	const startVertex = vertexParser(offset).map(idx => vertexes[idx])
	const endVertex = vertexParser(offset + 2).map(idx => vertexes[idx])

	const parseSide = shortOpParser(v => v < sidedefs.length && v >= 0,
		v => 'Sidedef out of bound: ' + v + ' of ' + sidedefs.length + ' on ' + offset)

	const frontSide = parseSide(offset + 10).map(idx => sidedefs[idx])
	const backSide = parseSide(offset + 12).map(idx => sidedefs[idx])

	const sector = frontSide.map(fs => Either.ofCondition(() => fs.sector.id > 0 && fs.sector.id < sectors.length,
		() => 'No Sector for Linedef: ' + thingIdx, () => sectors[fs.sector.id]))

	return Either.ofTruth([startVertex, endVertex, frontSide, sector], () =>
		({
			id: thingIdx,
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

const findMinX = (linedefs: Linedef[]): number =>
	R.reduce((min: number, ld: Linedef) => Math.min(min, ld.start.x, ld.end.x), Number.MAX_SAFE_INTEGER, linedefs)

const findMinY = (linedefs: Linedef[]): number =>
	R.reduce((min: number, ld: Linedef) => Math.min(min, ld.start.y, ld.end.y), Number.MAX_SAFE_INTEGER, linedefs)

const findMax = (linedefs: Linedef[]): number =>
	R.reduce((max: number, ld: Linedef) => Math.max(max, ld.start.x, ld.start.y, ld.end.x, ld.end.y),
		Number.MIN_SAFE_INTEGER, linedefs)

const scalePos = (scale: number) => (min: number) => (pos: number): number => {
	return Math.round((pos + min) / scale)
}

const normalizeLinedefs = (scale: number) => (linedefs: Linedef[]): Linedef[] => {
	const minX = Math.abs(findMinX(linedefs))
	const minY = Math.abs(findMinY(linedefs))
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

/** Tries to insert given #candidate into #path */
const insertIntoPath = <V extends VectorV>(path: V[]) => (candidate: V): Either<V[]> =>
	prependToPath(path)(candidate).orAnother(() => appendToPath(path)(candidate))

/**
 * Tries to insert given #candidate at the beginning #path.
 * Inserted element will be eventually flipped.
 * It will not directly connect two crossing vectors.
 */
const prependToPath = <V extends VectorV>(path: V[]) => (candidate: V): Either<V[]> => {
	const element = path[0]
	const connection = mf.vectorsConnected(candidate, element)
	return R.cond([
		[() => mf.areCrossing(candidate, element), () => Either.ofLeft<V[]>(() => 'Crossing vectors.')],
		[(con) => con === VectorConnection.NONE, () => Either.ofLeft<V[]>(() => 'Vector does not connect with path start.')],
		[(con) => ((con === VectorConnection.V1START_TO_V2END || con === VectorConnection.V1END_TO_V2END) && path.length == 1),
			() => Either.ofLeft<V[]>(() => 'Vector should be appended.')],
		[(con) => con === VectorConnection.V1END_TO_V2START, () => Either.ofRight([candidate].concat(path))],
		[(con) => con === VectorConnection.V1START_TO_V2START, () => Either.ofRight([mf.reverseVector(candidate)].concat(path))],
		[R.T, () => Either.ofWarn<V[]>(() => 'Unsupported connection: [' + connection + '] to prepend: ' + mf.stringifyVector(candidate) + ' to ' + mf.stringifyVectors(path))]
	])(connection)
}

/**
 * Tries to insert given #candidate on the end of the #path.
 * Inserted element will be eventually flipped.
 * It will not directly connect two crossing vectors.
 */
const appendToPath = <V extends VectorV>(path: V[]) => (candidate: V): Either<V[]> => {
	const element = path[path.length - 1]
	const connection = mf.vectorsConnected(element, candidate)
	return R.cond([
		[() => mf.areCrossing(candidate, element), () => Either.ofLeft<V[]>(() => 'Crossing vectors.')],
		[(con) => con === VectorConnection.NONE, () => Either.ofLeft<V[]>(() => 'Vector does not connect with path end.')],
		[(con) => ((con === VectorConnection.V1START_TO_V2END || con === VectorConnection.V1END_TO_V2END) && path.length == 1),
			() => Either.ofLeft<V[]>(() => 'Vector should be prepended.')],
		[(con) => con === VectorConnection.V1END_TO_V2START, () => Either.ofRight(path.concat(candidate))],
		[(con) => con === VectorConnection.V1END_TO_V2END, () => Either.ofRight(path.concat(mf.reverseVector(candidate)))],
		[R.T, () => Either.ofWarn<V[]>(() => 'Unsupported connection: [' + connection + '] to append: ' + mf.stringifyVector(candidate) + ' to ' + mf.stringifyVectors(path))]
	])(connection)
}

/**
 * Shapes can have common ages. To close such forms properly, they require special treatment. We will separate all
 * vectors into two groups: crossing vectors (having a common point) and remaining. The problem is to figure out to
 * which shape crossing vectors belong so that we do not connect shapes meant to be separated. A path building
 * will be spread into two phases to solve that problem: 1) create paths from remaining vectors without crossings.
 * That will make some open paths; a few might be closed if they do not need a vector from crossings to build a closed shape.
 * 2) Add crossing vectors to already existing paths, BUT ensure that vectors from crossings do not connect directly.
 * It would result in a path between two shapes. To achieve that, we will add to existing paths vectors from crossing,
 * one by one, but we will connect those to that path side, which does not contain already vector from crossing.
 */
const buildPaths = <V extends VectorV>(vectors: V[]): V[][] => {
	const grouped = mf.groupCrossingVectors(vectors)
	if (grouped.isRight()) {
		const cv = grouped.get();
		let paths = expendPaths(cv.remaining, [])
		cv.crossing.flat().forEach(cr => {
			paths = expendPaths([cr], paths)
		})
		return paths;
	} else {
		return expendPaths(vectors, [])
	}
}

/** #paths contains array of paths: [[path1],[path2],...,[pathX]] */
const expendPaths = <V extends VectorV>(vectors: V[], existingPaths: V[][]): V[][] => {

	// we will remove elements one by one from this list and add them to #paths
	const remaining = [...vectors]
	const paths = [...existingPaths]
	let appended = paths.length > 0

	// go until all elements in #remaining has been moved to #paths
	while (remaining.length > 0) {

		// none of #remaining could be connected to already existing paths, so start a new path
		if (!appended) {
			paths.push([remaining.pop()])
		}

		appended = false
		// go over each path in #paths and try to append to this path vector from #remaining
		for (let pathIdx = 0; pathIdx < paths.length; pathIdx++) {
			const path = paths[pathIdx];
			if (mf.pathContinuos(path)) {
				continue;
			}
			const pathBuilder = insertIntoPath(path)

			// go over all #remaining (not used) vectors and test whether we can append it to current path
			for (let remIdx = 0; !appended && remIdx < remaining.length; remIdx++) {
				pathBuilder(remaining[remIdx]).exec(alteredPath => {
					appended = true
					paths[pathIdx] = alteredPath

					// remove vector from #remaining as we have appended it to current path
					remaining.splice(remIdx, 1)
				})
			}
		}
	}
	return paths
}

const findMaxVectorVBy = (path: VectorV[]) => (maxFn: (a: VectorV) => number): VectorV =>
	R.reduce(R.maxBy<VectorV>(maxFn), MIN_VECTOR_V, path)

const createMaxVertex = (path: VectorV[]): Vertex => {
	const maxFinder = findMaxVectorVBy(path)

	const maxStartX = maxFinder(v => v.start.x).start.x
	const maxEndX = maxFinder(v => v.end.x).end.x

	const maxStartY = maxFinder(v => v.start.y).start.y
	const maxEndY = maxFinder(v => v.end.y).end.y

	return {x: Math.max(maxStartX, maxEndX), y: Math.max(maxStartY, maxEndY)}
}

const findMaxPathIdx = (paths: VectorV[][]): number => {
	const maxVertex = paths.map(path => createMaxVertex(path))
	let maxX = maxVertex[0].x
	let foundIdx = 0
	for (let i = 1; i < maxVertex.length; i++) {
		const x = maxVertex[i].x
		if (x > maxX) {
			foundIdx = i
			maxX = x
		}
	}
	return foundIdx
}

const sortByHoles = <V extends VectorV>(path: V[][]): V[][] => {
	if (path.length <= 1) {
		return path
	}
	const maxIdx = findMaxPathIdx(path)
	const res = [...path]
	const first = res.splice(maxIdx, 1)[0]
	res.unshift(first)
	return res
}


// ############################ EXPORTS ############################
export const testFunctions = {
	isMapName,
	createMaxVertex,
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
	findMinX,
	findMinY,
	findMax,
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
	buildPaths,
	findMaxPathIdx,
	sortByHoles,
	findBackLinedefs,
	findMaxSectorId,
	findCrossingVertex,
	insertIntoPath,
	prependToPath,
	appendToPath
}

export const functions = {parseMaps, normalizeLinedefs}
