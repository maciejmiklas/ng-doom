import * as R from 'ramda';
import {Either} from '@maciejmiklas/functional-ts';
import {Directory, Linedef, MapLumpType, Sidedef, Thing, Vertex} from './wad_model';
import {Log} from '../../common/is/log';
import U from '../../common/is/util';

/** The type of the map has to be in the form ExMy or MAPxx */
const isMapName = (name: string): boolean =>
	!R.isNil(name) && name.length > 4 && name.startsWith('MAP') || (name.charAt(0) === 'E' && name.charAt(2) === 'M');

/** Finds next map in directory */
const findNextMapDir = (dirs: Directory[]) => (offset: number): Either<Directory> =>
	Either.ofNullable(dirs.find(d => d.idx >= offset && isMapName(d.name)), () => 'No Map-Directory on offset:' + offset);

const unfoldByDirectorySize = (dir: Directory, size: number): number[] =>
	R.unfold((idx) => idx === dir.size / size ? false : [dir.filepos + idx * 10, idx + 1], 0);

const parseThing = (bytes: number[], dir: Directory) => (thingIdx: number): Thing => {
	const offset = dir.filepos + 10 * thingIdx;
	const shortParser = U.parseShort(bytes);
	const thing = {
		dir,
		name: MapLumpType.THINGS,
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

const parseThings = (bytes: number[], dirs: Directory[]) => (idx: number): Either<Thing[]> => {
	const thingDir = dirs[idx + MapLumpType.THINGS];
	const parser = parseThing(bytes, thingDir);
	return Either.ofCondition(
		() => thingDir.name === 'THINGS',
		() => 'Directory: ' + thingDir + ' on map ' + idx + ' is not a Thing',
		() => unfoldByDirectorySize(thingDir, 10)
			.map((ofs, thingIdx) => parser(thingIdx)).map(th => th));
};

const parseSidedef = (bytes: number[], dir: Directory) => (idx: number): Sidedef => {
	const offset = dir.filepos + 30 * idx;
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
	Log.trace('mod_parser#parseSidedef', 'Parsed Sidedef on %1 -> %2', idx, sidedef);
	return sidedef;
};

const parseSidedefs = (bytes: number[], dirs: Directory[]) => (mapIdx: number): Either<Sidedef[]> => {
	const thingDir = dirs[mapIdx + MapLumpType.SIDEDEFS];
	const parser = parseSidedef(bytes, thingDir);
	return Either.ofCondition(
		() => thingDir.name === 'SIDEDEFS',
		() => 'Directory: ' + thingDir + ' on map ' + mapIdx + ' is not a Sidedef',
		() => unfoldByDirectorySize(thingDir, 30)
			.map((ofs, thingIdx) => parser(thingIdx)).map(th => th));
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

const parseLinedefs = (bytes: number[], dirs: Directory[], vertexes: Vertex[], sidedefs: Sidedef[]) => (mapIdx: number):
	Either<Linedef[]> => {
	const linedefsDir = dirs[mapIdx + MapLumpType.LINEDEFS];
	const parser = parseLinedef(bytes, linedefsDir, vertexes, sidedefs);
	const parsed = unfoldByDirectorySize(linedefsDir, 14).map((ofs, thingIdx) => parser(thingIdx)).filter(v => v.isRight()).map(v => v.get());
	return Either.ofCondition(
		() => linedefsDir.name === 'LINEDEFS' && parsed.length > 0,
		() => 'Directory: ' + linedefsDir + ' on map ' + mapIdx + ' is not a LINEDEFS',
		() => parsed);
};

const parseVertex = (bytes: number[], thingDir: Directory) => (thingIdx: number): Vertex => {
	const offset = thingDir.filepos + 4 * thingIdx;
	const shortParser = U.parseShort(bytes);
	return {
		x: shortParser(offset),
		y: shortParser(offset + 2),
	};
};

const parseVertexes = (bytes: number[], dirs: Directory[]) => (mapIdx: number): Either<Vertex[]> => {
	const thingDir = dirs[mapIdx + MapLumpType.VERTEXES];
	const parser = parseVertex(bytes, thingDir);
	return Either.ofCondition(
		() => thingDir.name === 'VERTEXES',
		() => 'Directory: ' + thingDir + ' on map ' + mapIdx + ' is not a VERTEXES',
		() => unfoldByDirectorySize(thingDir, 4).map((ofs, thingIdx) => parser(thingIdx)));
};

// ############################ EXPORTS ############################
export const testFunctions = {
	isMapName,
	findNextMapDir,
	parseThing,
	parseThings,
	parseVertex,
	parseVertexes,
	parseLinedef,
	parseLinedefs,
	parseSidedef,
	parseSidedefs
};
