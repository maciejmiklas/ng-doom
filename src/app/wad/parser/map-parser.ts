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
import * as R from 'ramda';
import {Either} from '../../common/either';
import {
	Bitmap,
	Directory,
	DoomMap,
	DoomTexture,
	Floor,
	functions as mf,
	Linedef,
	LinedefBySector,
	LinedefFlag,
	MapLumpType,
	Sector,
	Sidedef,
	Thing,
	VectorConnection,
	VectorV,
	Vertex
} from './wad-model';
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

const createTextureLoader = (textures: DoomTexture[]) => (name: string): Either<DoomTexture> =>
	Either.ofNullable(textures.find(t => t.name === name), () => 'DoomTexture not found: ' + name);

const createFlatLoader = (flats: Bitmap[]) => (name: string): Either<Bitmap> =>
	Either.ofNullable(flats.find(t => t.name === name), () => 'Flat not found: ' + name);

const parseMaps = (bytes: number[], dirs: Directory[], textures: DoomTexture[], flats: Bitmap[]): Either<DoomMap[]> => {
	const textureLoader = createTextureLoader(textures);
	const flatLoader = createFlatLoader(flats);
	return Either.ofArray(parseMapsDirs(dirs, findAllMapStartDirs(dirs)).map(parseMap(bytes, textureLoader, flatLoader)), () => 'No maps found');
};

const parseMap = (bytes: number[], textureLoader: (name: string) => Either<DoomTexture>, flatLoader: (name: string) => Either<Bitmap>) => (mapDirs: Directory[]): DoomMap => {
	const sectors = parseSectors(bytes)(mapDirs, flatLoader);
	const linedefs = parseLinedefs(bytes, mapDirs, parseVertexes(bytes)(mapDirs), parseSidedefs(bytes, textureLoader)(mapDirs, sectors), sectors);
	return {
		mapDirs,
		things: parseThings(bytes)(mapDirs),
		linedefs,
		sectors,
		linedefBySector: groupBySector(linedefs, sectors)
	};
};

/** group Linedef by Sector */
const groupBySectorArray = (linedefs: Linedef[]): Linedef[][] => {
	const sorted = R.sortBy((ld: Linedef) => ld.sector.id)(linedefs); // sort by #sector.id in order to be able to group by it
	return R.groupWith((a: Linedef, b: Linedef) => a.sector.id === b.sector.id, sorted);
};

const groupBySector = (linedefs: Linedef[], sectors: Sector[]): LinedefBySector[] => {
	const bySector = groupBySectorArray(linedefs);

	// transfer Linedef[][] into Map, where Key is the sectorId number
	const byId: { [sector: number]: Linedef[] } = R.indexBy((ld: Linedef[]) => ld[0].sector.id, bySector);
	return Object.keys(byId).map(k => {
		const sector = sectors[k];
		const linedefs = byId[k];
		return {
			sector,
			linedefs,
			floor: {
				sector,
				walls: sortPath<Linedef>(linedefs)[0],
				holes: Either.ofLeft('TODO')
			}
		}
	});
};

const unfoldByDirectorySize = (dir: Directory, size: number): number[] =>
	R.unfold((idx) => idx === dir.size / size ? false : [dir.filepos + idx * 10, idx + 1], 0);

const parseThing = (bytes: number[], thingDir: Directory) => (thingIdx: number): Thing => {
	const offset = thingDir.filepos + 10 * thingIdx;
	const shortParser = U.parseInt16(bytes);
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

const parseSector = (bytes: number[], dir: Directory, flatLoader: (name: string) => Either<Bitmap>,) => (thingIdx: number): Sector => {
	const offset = dir.filepos + 26 * thingIdx;
	const shortParser = U.parseInt16(bytes);
	const strParser = U.parseStr(bytes);
	return {
		dir,
		type: MapLumpType.SECTORS,
		floorHeight: shortParser(offset),
		cellingHeight: shortParser(offset + 0x02),
		floorTexture: flatLoader(strParser(offset + 0x04, 8)),
		cellingTexture: flatLoader(strParser(offset + 0x0C, 8)),
		lightLevel: shortParser(offset + 0x14),
		specialType: shortParser(offset + 0x16),
		tagNumber: shortParser(offset + 0x18),
		id: thingIdx,
	};
};

const parseSectors = (bytes: number[]) => (mapDirs: Directory[], flatLoader: (name: string) => Either<Bitmap>): Sector[] => {
	const thingDir = mapDirs[MapLumpType.SECTORS];
	const parser = parseSector(bytes, thingDir, flatLoader);
	return unfoldByDirectorySize(thingDir, 26).map((ofs, thingIdx) => parser(thingIdx));
};

const parseSidedef = (bytes: number[], dir: Directory, textureLoader: (name: string) => Either<DoomTexture>, sectors: Sector[]) => (thingIdx: number): Either<Sidedef> => {
	const offset = dir.filepos + 30 * thingIdx;
	const shortParser = U.parseInt16(bytes);
	const strOpParser = U.parseTextureName(bytes);
	const sectorId = shortParser(offset + 0x1C);
	return Either.ofCondition(
		() => sectorId < sectors.length && sectorId > 0,
		() => 'No Sidedef on ' + thingIdx,
		() => ({
			dir,
			type: MapLumpType.SIDEDEFS,
			offset: {
				x: shortParser(offset),
				y: shortParser(offset + 2),
			},
			upperTexture: strOpParser(offset + 0x04, 8).map(textureLoader),
			lowerTexture: strOpParser(offset + 0x0C, 8).map(textureLoader),
			middleTexture: strOpParser(offset + 0x14, 8).map(textureLoader),
			sector: sectors[shortParser(offset + 0x1C)]
		}));
};

const parseSidedefs = (bytes: number[], textureLoader: (name: string) => Either<DoomTexture>) => (mapDirs: Directory[], sectors: Sector[]): Either<Sidedef>[] => {
	const thingDir = mapDirs[MapLumpType.SIDEDEFS];
	const parser = parseSidedef(bytes, thingDir, textureLoader, sectors);
	return unfoldByDirectorySize(thingDir, 30) //Each Sidedef is 30 bytes large
		.map((ofs, thingIdx) => parser(thingIdx));
};

const parseLinedefs = (bytes: number[], mapDirs: Directory[], vertexes: Vertex[], sidedefs: Either<Sidedef>[], sectors: Sector[]): Linedef[] => {
	const linedefsDir = mapDirs[MapLumpType.LINEDEFS];
	const parser = parseLinedef(bytes, linedefsDir, vertexes, sidedefs, sectors);
	return unfoldByDirectorySize(linedefsDir, 14) // Linedef has 14 bytes
		.map((ofs, thingIdx) => parser(thingIdx))// thingIdx => Either<Linedef>
		.filter(v => v.filter()).map(v => v.get()); // Either<Linedef> => Linedef
};

const parseFlags = (val: number): Set<LinedefFlag> =>
	new Set<LinedefFlag>(
		Object.keys(LinedefFlag) // iterate over all entries from LinedefFlag
			.map(Number).filter(k => !isNaN(k)) // map keys: LinedefFlag => number
			.filter(k => (1 << (k - 1) & val) != 0)// remove not set bits;
	);

const parseLinedef = (bytes: number[], dir: Directory, vertexes: Vertex[], sidedefs: Either<Sidedef>[], sectors: Sector[]) => (thingIdx: number): Either<Linedef> => {
	const offset = dir.filepos + 14 * thingIdx;
	const shortParser = U.parseInt16(bytes);
	const intParser = U.parseInt32(bytes);
	const shortOpParser = U.parseInt16Op(bytes);

	const vertexParser = shortOpParser(v => v < vertexes.length && v >= 0,
		v => 'Vertex out of bound: ' + v + ' of ' + vertexes.length + ' on ' + offset);

	const startVertex = vertexParser(offset).map(idx => vertexes[idx]);
	const endVertex = vertexParser(offset + 2).map(idx => vertexes[idx]);

	const parseSide = shortOpParser(v => v < sidedefs.length && v >= 0,
		v => 'Sidedef out of bound: ' + v + ' of ' + sidedefs.length + ' on ' + offset);

	const frontSide = parseSide(offset + 10).map(idx => sidedefs[idx]);
	const backSide = parseSide(offset + 12).map(idx => sidedefs[idx]);

	const sector = frontSide.map(fs => Either.ofCondition(() => fs.sector.id > 0 && fs.sector.id < sectors.length,
		() => 'No Sector for Linedef: ' + thingIdx, () => sectors[fs.sector.id]));

	return Either.ofTruth([startVertex, endVertex, frontSide, sector], () =>
		({
			id: thingIdx,
			dir,
			type: MapLumpType.LINEDEFS,
			start: startVertex.get(),
			end: endVertex.get(),
			flags: parseFlags(intParser(offset + 0x04)),
			specialType: shortParser(offset + 0x06),
			sectorTag: shortParser(offset + 0x08),
			frontSide: frontSide.get(),
			backSide,
			sector: sector.get()
		}));
};

const parseVertex = (bytes: number[], vertexDir: Directory) => (thingIdx: number): Vertex => {
	const offset = vertexDir.filepos + 4 * thingIdx;
	const shortParser = U.parseInt16(bytes);
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

const createFloor = (linedefs: Linedef[]) => (lbs: LinedefBySector): Floor => {
	return null;
}

const findBacksidesBySector = (linedefs: Linedef[]) => (sectorId: number): Either<Linedef[]> =>
	Either.ofArray(linedefs.filter(ld => ld.backSide.isRight()).filter(ld => ld.backSide.get().sector.id == sectorId),
		() => 'No backsides for Sector: ' + sectorId);

const findPathEl = (linedefs: VectorV[]) => (el: VectorV): number =>
	linedefs.findIndex(ld => mf.vertexEqual(el.start, ld.start) || mf.vertexEqual(el.start, ld.end) ||
		mf.vertexEqual(el.end, ld.start) || mf.vertexEqual(el.end, ld.end));

const findLastNotConnected = (linedefs: VectorV[]): Either<number> => {
	for (let i = linedefs.length - 1; i > 0; i--) {
		if (mf.vectorsConnected(linedefs[i], linedefs[i - 1]) === VectorConnection.NO) {
			return Either.ofRight(i);
		}
	}
	return Either.ofLeft('All vectors are connected');
}

const splitPath = <V extends VectorV>(unsorted: V[]): V[][] => {
	return null;
}

const sortPath_ = <V extends VectorV>(unsorted: V[]): V[][] => {
	const sorted = [...unsorted];
	const notConnected = [];
	for (let xx = 0; xx < 5000; xx++) {// max 5000 iterations
		const notConnectedEi = findLastNotConnected(sorted);
		if (notConnectedEi.isLeft()) {
			break;
		}
		const notConnectedIdx = notConnectedEi.get();
		const nc = sorted[notConnectedIdx];
		let moved = false;
		for (let i = 0; i < sorted.length; i++) {
			const cur = sorted[i];
			if (mf.vectorsConnected(cur, nc) === VectorConnection.NO) {
				continue;
			}

			if (mf.vectorsConnected(cur, nc) === VectorConnection.V1_TO_V2) {
				sorted.splice(i, 0, sorted.splice(notConnectedIdx, 1)[0]);
				moved = true;
				break;
			}
			if (mf.vectorsConnected(cur, nc) === VectorConnection.V2_TO_V1) {
				sorted.splice(notConnectedIdx, 0, sorted.splice(i, 1)[0]);
				moved = true;
				break;
			}
		}
		if (!moved) {
			notConnected.push(sorted.splice(notConnectedIdx, 1)[0]);
		}
	}
	//console.log('>V>', JSON.stringify(toSimpleVectors(sorted)));
	return [sorted, notConnected];
}

const sortPath = <V extends VectorV>(unsorted: V[]): V[][] => {
	const remaining = [...unsorted];
	const out = [[remaining.pop()]];

	while (remaining.length > 0) {
		let found = false;
		out.forEach(oa => {
			const el = oa[oa.length - 1];
			for (let i = 0; i < remaining.length; i++) {
				const cur = remaining[i];
				if (mf.vectorsConnected(el, cur) === VectorConnection.NO) {
					continue;
				}

				if (mf.vectorsConnected(el, cur) === VectorConnection.V1_TO_V2) {
					const ne = remaining.splice(i, 1)[0];
					oa.push(ne);
					found = true;
					break;
				}
				if (mf.vectorsConnected(el, cur) === VectorConnection.V2_TO_V1) {
					const ne = remaining.splice(i, 1)[0];
					oa.splice(oa.length - 2, 0, ne);
					found = true;
					break;
				}
			}
		})
		if (!found) {
			out.push([remaining.pop()])
		}
	}
	//console.log('>V>', JSON.stringify(toSimpleVectors(sorted)));
	return out;
}

const toSimpleVectors = (vectors: VectorV[]): VectorV[] => vectors.map(v => ({start: v.start, end: v.end}))

// ############################ EXPORTS ############################
export const testFunctions = {
	findPathEl,
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
	groupBySector,
	createTextureLoader,
	groupBySectorArray,
	parseFlags,
	createFlatLoader,
	findBacksidesBySector,
	findLastNotConnected,
	sortPath
};

export const functions = {parseMaps, normalizeLinedefs};
