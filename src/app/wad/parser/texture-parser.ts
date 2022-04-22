import * as R from 'ramda';
import {Directories, Directory, MapPatch, Pnames, Texture, TextureDir} from './wad-model';
import U from '../../common/util';
import {functions as dp} from './directory-parser';
import {Either} from '@maciejmiklas/functional-ts';

const parsePnames = (wadBytes: number[], dirs: Directory[]): Pnames => {
	const dir: Directory = dp.findDirectoryByName(dirs)(Directories.PNAMES).get();
	const nummappatches = U.parseInt(wadBytes)(dir.filepos);
	const strParser = U.parseStr(wadBytes);
	const names: string[] = R
		.range(0, nummappatches) // ()=> Patches amount
		.map(idx => strParser(dir.filepos + 0x04 + 8 * idx, 8)); // (patch offset)=> patch names
	return {dir, nummappatches, names};
};

const parseTextures = (wadBytes: number[], dirs: Directory[], pnames: Pnames) => (td: TextureDir): Texture[] => {
	const dir: Directory = dp.findDirectoryByName(dirs)(td).get();
	const intParser = U.parseInt(wadBytes);
	const numtextures = intParser(dir.filepos);
	const parseTextureParser = parseTexture(wadBytes, dir, pnames);
	return R
		.range(0, numtextures)// ()=> Textures amount
		.map(idx => intParser(0x04 + idx * 4))// ()=> offsets to Textures
		.map(offset => parseTextureParser(offset));// ()=> Textur[]
};

const parseTexture = (wadBytes: number[], dir: Directory, pnames: Pnames) => (offset: number): Texture => {
	const strParser = U.parseStr(wadBytes);
	const shortParser = U.parseShort(wadBytes);
	const patchCountWad = shortParser(offset + 0x14);
	const patchMapParser = parseMapPatch(wadBytes, pnames);
	const patches = R
		.range(0, patchCountWad)// ()=> patches amount
		.map(idx => patchMapParser(offset + idx * 10))// (patchOffset)=> Either<MapPatch>
		.filter(e => e.isLeft())// remove Left
		.map(e => e.get()); // (Either<MapPatch>) => MapPatch
	return {
		dir,
		name: strParser(offset, 0x08),
		width: shortParser(offset + 0x0C),
		height: shortParser(offset + 0x0E),
		patchCount: patches.length,
		patches
	};
};

const parseMapPatch = (wadBytes: number[], pnames: Pnames) => (offset: number): Either<MapPatch> => {
	const shortParser = U.parseShort(wadBytes);
	const patchIdx = shortParser(offset + 0x04);
	const patchName = Either.ofCondition(
		() => patchIdx >= pnames.names.length,
		() => 'patchIdx out of bound at:' + offset,
		() => pnames.names[patchIdx]);
	return Either.ofTruth([patchName], () => ({
		originX: shortParser(offset),
		originY: shortParser(offset + 0x02),
		patchIdx,
		patchName: patchName.get()
	}));
};

// ############################ EXPORTS ############################
export const testFunctions = {parseMapPatch};

export const functions = {parsePnames, parseTextures};
