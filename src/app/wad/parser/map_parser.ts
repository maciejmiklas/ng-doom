import * as R from 'ramda';
import {Either} from '@maciejmiklas/functional-ts';
import {Directory, Linedef, MapLumpType, Sidedef, Thing, Vertex, WadMap} from './wad_model';
import {Log} from '../../common/is/log';
import U from '../../common/is/util';

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

const parseMaps = (bytes: number[], dirs: Directory[]): Either<WadMap[]> => {
	return Either.ofArray(parseMapsDirs(dirs, findAllMapStartDirs(dirs)).map(parseMap(bytes)), () => 'No maps found');
};

const parseMap = (bytes: number[]) => (mapDirs: Directory[]): WadMap =>
	({
		mapDirs,
		things: parseThings(bytes)(mapDirs),
		linedefs: parseLinedefs(bytes)(mapDirs, parseVertexes(bytes)(mapDirs), parseSidedefs(bytes)(mapDirs)),
		segs: null,// TODO
		ssectors: null,// TODO
		nodes: null,// TODO
		sectors: null// TODO
	});

const unfoldByDirectorySize = (dir: Directory, size: number): number[] =>
	R.unfold((idx) => idx === dir.size / size ? false : [dir.filepos + idx * 10, idx + 1], 0);

const parseThing = (bytes: number[], thingDir: Directory) => (thingIdx: number): Thing => {
	const offset = thingDir.filepos + 10 * thingIdx;
	const shortParser = U.parseShort(bytes);
	const thing = {
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
	Log.trace('mod_parser#parseThing', 'Parsed Thing on %1 -> %2', thingIdx, thing);
	return thing;
};

const parseThings = (bytes: number[]) => (mapDirs: Directory[]): Thing[] => {
	const thingDir = mapDirs[MapLumpType.THINGS];
	const parser = parseThing(bytes, thingDir);
	return unfoldByDirectorySize(thingDir, 10).map((ofs, thingIdx) => parser(thingIdx)).map(th => th);
};

const parseSidedef = (bytes: number[], dir: Directory) => (mapDirIdx: number): Sidedef => {
	const offset = dir.filepos + 30 * mapDirIdx;
	const shortParser = U.parseShort(bytes);
	const strOpParser = U.parseStrOp(bytes)(v => v !== '-', () => '');
	const sidedef = {
		dir,
		type: MapLumpType.SIDEDEFS,
		offset: {
			x: shortParser(offset),
			y: shortParser(offset + 2),
		},
		upperTexture: strOpParser(offset + 4, 8),
		lowerTexture: strOpParser(offset + 12, 8),
		middleTexture: strOpParser(offset + 20, 8),
		sector: shortParser(offset + 28)
	};
	Log.trace('mod_parser#parseSidedef', 'Parsed Sidedef on %1 -> %2', mapDirIdx, sidedef);
	return sidedef;
};

const parseSidedefs = (bytes: number[]) => (mapDirs: Directory[]): Sidedef[] => {
	const thingDir = mapDirs[MapLumpType.SIDEDEFS];
	const parser = parseSidedef(bytes, thingDir);
	return unfoldByDirectorySize(thingDir, 30).map((ofs, thingIdx) => parser(thingIdx)).map(th => th);
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
			flags: shortParser(offset + 4),
			specialType: shortParser(offset + 6),
			sectorTag: shortParser(offset + 8),
			frontSide: frontSide.get(),
			backSide
		})).exec(v => {
		Log.trace('mod_parser#parseLinedef', 'Parsed Linedef on %1 -> %2', thingIdx, v);
	});
};

const parseLinedefs = (bytes: number[]) => (mapDirs: Directory[], vertexes: Vertex[], sidedefs: Sidedef[]): Linedef[] => {
	const linedefsDir = mapDirs[MapLumpType.LINEDEFS];
	const parser = parseLinedef(bytes, linedefsDir, vertexes, sidedefs);
	return unfoldByDirectorySize(linedefsDir, 14).map((ofs, thingIdx) => parser(thingIdx)).filter(v => v.isRight()).map(v => v.get());
};

const parseVertex = (bytes: number[], vertexDir: Directory) => (thingIdx: number): Vertex => {
	const offset = vertexDir.filepos + 4 * thingIdx;
	const shortParser = U.parseShort(bytes);
	return {
		x: shortParser(offset),
		y: shortParser(offset + 2),
	};
};

const parseVertexes = (bytes: number[]) => (mapDirs: Directory[]): Vertex[] => {
	const vertexDir = mapDirs[MapLumpType.VERTEXES];
	const parser = parseVertex(bytes, vertexDir);
	return unfoldByDirectorySize(vertexDir, 4).map((ofs, thingIdx) => parser(thingIdx));
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
	parseMapsDirs
};

export const functions = {parseMaps};
