import * as R from 'ramda';
import {Either} from '@maciejmiklas/functional-ts';
import {Directory, Linedef, MapLumpType, Sector, Sidedef, Thing, Vertex, WadMap, WadParseOptions, WadParseOptionsDef} from './wad-model';
import U from '../../common/util';

/** The type of the map has to be in the form ExMy or MAPxx */
const isMapName = (name: string): boolean =>
	!R.isNil(name) && name.length > 4 && name.startsWith('MAP') || (name.charAt(0) === 'E' && name.charAt(2) === 'M');

/** Finds next map in directory */
const findNextMapStartingDir = (dirs: Directory[]) => (dirOffset: number): Either<Directory> =>
	U.findFrom(dirs)(dirOffset, (d, idx) => isMapName(d.name));

/** fins all starting dirs for all maps. */
const findAllMapStartDirs = (dirs: Directory[]): Directory[] => {
	const findNext = findNextMapStartingDir(dirs);
	return R.unfold((dirIdx: number) => findNext(dirIdx).mapGet(msg => false, d => [d, d.idx + 1]), 1);
};

/** parse all dir for single map */
const parseMapDirs = (dirs: Directory[]) => (mapDir: Directory): Either<Directory[]> => {
	const mapDirs: Directory[] = R.slice(mapDir.idx, mapDir.idx + MapLumpType.BLOCKMAP + 1, dirs);
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
		() => 'Incorrect map folders: ' + mapDir + ' -> ' + mapDirs, () => mapDirs);
};

const parseMapsDirs = (allDirs: Directory[], startMapDirs: Directory[]): Directory[][] =>
	R.mapAccum((acc, dir) =>
		[acc, parseMapDirs(allDirs)(dir).orElseGet(() => null)], [], startMapDirs)[1].filter(v => !R.isNil(v));

const parseMaps = (bytes: number[], dirs: Directory[], options: WadParseOptions = WadParseOptionsDef): Either<WadMap[]> => {
	return Either.ofArray(parseMapsDirs(dirs, findAllMapStartDirs(dirs)).map(parseMap(bytes, options)), () => 'No maps found');
};

const parseMap = (bytes: number[], options: WadParseOptions = WadParseOptionsDef) => (mapDirs: Directory[]): WadMap => {
	let linedefs = parseLinedefs(bytes)(mapDirs, parseVertexes(bytes)(mapDirs), parseSidedefs(bytes)(mapDirs));
	linedefs = R.isNil(options.linedefScale) ? linedefs : normalizeLinedefs(options.linedefScale)(linedefs);
	const sectors = parseSectors(bytes)(mapDirs);
	return {
		mapDirs,
		things: parseThings(bytes)(mapDirs),
		linedefs,
		segs: null,// TODO
		ssectors: null,// TODO
		nodes: null,// TODO
		sectors,
		linedefsBySector: groupBySector(linedefs)
	};
};

/** @return Map -> K: sector number, V:Linedef array where each Linedef has the same sector number. */
const groupBySector = (linedefs: Linedef[]): { [sector: number]: Linedef[] } => {
	// group Linedef by Sector
	const bySector: Linedef[][] = R.groupWith((a: Linedef, b: Linedef) => a.frontSide.sector === b.frontSide.sector, linedefs);

	// transfer Linedef[][] into Map, where Key is the sector number
	return R.indexBy((ld: Linedef[]) => ld[0].frontSide.sector, bySector);
};

const unfoldByDirectorySize = (dir: Directory, size: number): number[] =>
	R.unfold((idx) => idx === dir.size / size ? false : [dir.filepos + idx * 10, idx + 1], 0);

const parseThing = (bytes: number[], thingDir: Directory) => (thingIdx: number): Thing => {
	const offset = thingDir.filepos + 10 * thingIdx;
	const shortParser = U.parseShort(bytes);
	return {
		dir: thingDir,
		position: {
			x: shortParser(offset),
			y: shortParser(offset + 2),
		},
		angleFacing: shortParser(offset + 4),

		// TODO type should be enum from https://doomwiki.org/wiki/Thing_types#Monsters
		type: shortParser(offset + 6),
		flags: shortParser(offset + 8),
	};
};

const parseThings = (bytes: number[]) => (mapDirs: Directory[]): Thing[] => {
	const thingDir = mapDirs[MapLumpType.THINGS];
	const parser = parseThing(bytes, thingDir);
	return unfoldByDirectorySize(thingDir, 10).map((ofs, thingIdx) => parser(thingIdx)).map(th => th);
};

const parseSector = (bytes: number[], dir: Directory) => (thingIdx: number): Sector => {
	const offset = dir.filepos + 26 * thingIdx;
	const shortParser = U.parseShort(bytes);
	const strParser = U.parseStr(bytes);
	return {
		dir,
		type: MapLumpType.SECTORS,
		floorHeight: shortParser(offset),
		ceilingHeight: shortParser(offset + 0x02),
		floorTexture: strParser(offset + 0x04, 8),
		cellingTexture: strParser(offset + 0x0C, 8),
		lightLevel: shortParser(offset + 0x14),
		specialType: shortParser(offset + 0x16),
		tagNumber: shortParser(offset + 0x18),
		sectorNumber: thingIdx
	};
};

const parseSectors = (bytes: number[]) => (mapDirs: Directory[]): Sector[] => {
	const thingDir = mapDirs[MapLumpType.SECTORS];
	const parser = parseSector(bytes, thingDir);
	return unfoldByDirectorySize(thingDir, 26).map((ofs, thingIdx) => parser(thingIdx)).map(th => th);
};

const parseSidedef = (bytes: number[], dir: Directory) => (thingIdx: number): Sidedef => {
	const offset = dir.filepos + 30 * thingIdx;
	const shortParser = U.parseShort(bytes);
	const strOpParser = U.parseTextureName(bytes);
	return {
		dir,
		type: MapLumpType.SIDEDEFS,
		offset: {
			x: shortParser(offset),
			y: shortParser(offset + 2),
		},
		upperTexture: strOpParser(offset + 0x04, 8),
		lowerTexture: strOpParser(offset + 0x0C, 8),
		middleTexture: strOpParser(offset + 0x14, 8),
		sector: shortParser(offset + 0x1C)
	};
};

const parseSidedefs = (bytes: number[]) => (mapDirs: Directory[]): Sidedef[] => {
	const thingDir = mapDirs[MapLumpType.SIDEDEFS];
	const parser = parseSidedef(bytes, thingDir);
	return unfoldByDirectorySize(thingDir, 30).map((ofs, thingIdx) => parser(thingIdx)).map(th => th);
};

const parseLinedefs = (bytes: number[]) => (mapDirs: Directory[], vertexes: Vertex[], sidedefs: Sidedef[]): Linedef[] => {
	const linedefsDir = mapDirs[MapLumpType.LINEDEFS];
	const parser = parseLinedef(bytes, linedefsDir, vertexes, sidedefs);
	return unfoldByDirectorySize(linedefsDir, 14).map((ofs, thingIdx) => parser(thingIdx)).filter(v => v.isRight()).map(v => v.get());
};

const parseLinedef = (bytes: number[], dir: Directory, vertexes: Vertex[], sidedefs: Sidedef[]) => (thingIdx: number): Either<Linedef> => {
	const offset = dir.filepos + 14 * thingIdx;
	const shortParser = U.parseShort(bytes);
	const shortOpParser = U.parseShortOp(bytes);

	const vertexParser = shortOpParser(v => v < vertexes.length && v >= 0,
		v => 'Vertex out of bound: ' + v + ' of ' + vertexes.length + ' on ' + offset);
	const startVertex = vertexParser(offset).map(idx => vertexes[idx]);
	const endVertex = vertexParser(offset + 2).map(idx => vertexes[idx]);

	const parseSide = shortOpParser(v => v < sidedefs.length && v >= 0,
		v => 'Sidedef out of bound: ' + v + ' of ' + sidedefs.length + ' on ' + offset);
	const frontSide = parseSide(offset + 10).map(idx => sidedefs[idx]);
	const backSide = parseSide(offset + 12).map(idx => sidedefs[idx]);

	return Either.ofTruth([startVertex, endVertex, frontSide], () =>
		({
			dir,
			type: MapLumpType.LINEDEFS,
			start: startVertex.get(),
			end: endVertex.get(),
			flags: shortParser(offset + 0x04),
			specialType: shortParser(offset + 0x06),
			sectorTag: shortParser(offset + 0x08),
			frontSide: frontSide.get(),
			backSide
		}));
};

const parseVertex = (bytes: number[], vertexDir: Directory) => (thingIdx: number): Vertex => {
	const offset = vertexDir.filepos + 4 * thingIdx;
	const shortParser = U.parseShort(bytes);
	return {
		x: shortParser(offset),
		y: shortParser(offset + 0x02),
	};
};

const parseVertexes = (bytes: number[]) => (mapDirs: Directory[]): Vertex[] => {
	const vertexDir = mapDirs[MapLumpType.VERTEXES];
	const parser = parseVertex(bytes, vertexDir);
	return unfoldByDirectorySize(vertexDir, 4).map((ofs, thingIdx) => parser(thingIdx));
};

const findMinX = (linedefs: Linedef[]): number =>
	R.reduce((min: number, ld: Linedef) => Math.min(min, ld.start.x, ld.end.x), Number.MAX_SAFE_INTEGER, linedefs);

const findMinY = (linedefs: Linedef[]): number =>
	R.reduce((min: number, ld: Linedef) => Math.min(min, ld.start.y, ld.end.y), Number.MAX_SAFE_INTEGER, linedefs);

const findMax = (linedefs: Linedef[]): number =>
	R.reduce((max: number, ld: Linedef) => Math.max(max, ld.start.x, ld.start.y, ld.end.x, ld.end.y),
		Number.MIN_SAFE_INTEGER, linedefs);

const scalePos = (scale: number) => (min: number) => (pos: number): number => {
	return Math.round((pos + min) / scale);
};

const normalizeLinedefs = (scale: number) => (linedefs: Linedef[]): Linedef[] => {
	const minX = Math.abs(findMinX(linedefs));
	const minY = Math.abs(findMinY(linedefs));
	const scaleFunc = scalePos(scale);
	const scaleX = scaleFunc(minX);
	const scaleY = scaleFunc(minY);
	return R.map(ld => {
		const nld = {...ld};
		nld.start = {x: scaleX(ld.start.x), y: scaleY(ld.start.y)};
		nld.end = {x: scaleX(ld.end.x), y: scaleY(ld.end.y)};
		return nld;
	}, linedefs);
};

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
	findMinX,
	findMinY,
	findMax,
	scalePos,
	parseSector,
	parseSectors,
	groupBySector
};

export const functions = {parseMaps, normalizeLinedefs};
