import * as R from 'ramda';
import {Directories, Directory, Patch, PatchBitmap, Pnames, Texture, TextureDir} from './wad-model';
import U from '../../common/util';
import {functions as dp} from './directory-parser';
import {functions as bp} from './bitmap-parser';
import {Either} from '@maciejmiklas/functional-ts';

const parsePnames = (wadBytes: number[], dirs: Directory[]): Pnames => {
	const dir: Directory = dp.findDirectoryByName(dirs)(Directories.PNAMES).get();
	const nummappatches = U.parseInt(wadBytes)(dir.filepos);
	const strParser = U.parseStr(wadBytes);
	const names: string[] = R
		.range(0, nummappatches) // ()=> Patches amount
		.map(idx => strParser(dir.filepos + 0x04 + 8 * idx, 8).toUpperCase()); // (patch offset)=> patch names
	return {dir, nummappatches, names};
};

const parseTextures = (wadBytes: number[], dirs: Directory[]) => (td: TextureDir): Texture[] => {
	const pnames = parsePnames(wadBytes, dirs);
	const dir: Directory = dp.findDirectoryByName(dirs)(td).get();
	const intParser = U.parseInt(wadBytes);
	const parseTextureParser = parseTexture(wadBytes, dirs, dir, pnames);
	const offset = dir.filepos;
	return R
		.range(0, intParser(offset))// ()=> Textures amount (numtextures)
		.map(idx => offset + intParser(offset + 0x04 + idx * 4))// ()=> offsets to Textures
		.map(offset => parseTextureParser(offset));// ()=> Textur[]
};

const parseTexture = (wadBytes: number[], dirs: Directory[], dir: Directory, pnames: Pnames) => (offset: number): Texture => {
	const strParser = U.parseStr(wadBytes);
	const shortParser = U.parseShort(wadBytes);
	const patchCountWad = shortParser(offset + 0x14);
	const patchMapParser = parsePatch(wadBytes, dirs, pnames);
	const patches = R
		.range(0, patchCountWad)// ()=> patches amount
		.map(pn => offset + 22 + pn * 10)//(patch number) => patch offset
		.map(offset => patchMapParser(offset))// (patch offset)=> Either<Patch>
		.filter(e => e.isRight())// remove Left
		.map(e => e.get()); // (Either<Patch>) => Patch
	return {
		dir,
		name: strParser(offset, 8),
		width: shortParser(offset + 0x0C),
		height: shortParser(offset + 0x0E),
		patchCount: patches.length,
		patches
	};
};

const parsePatch = (wadBytes: number[], dirs: Directory[], pnames: Pnames) => (offset: number): Either<Patch> => {
	const shortParser = U.parseShort(wadBytes);
	const patchIdx = shortParser(offset + 0x04);
	const patchName = Either.ofCondition(
		() => patchIdx < pnames.names.length,
		() => 'patchIdx (' + patchIdx + ') out of bound (' + pnames.names.length + ') at:' + offset,
		() => pnames.names[patchIdx]);

	const bitmap = patchName
		.map(pn => findPatchDir(dirs)(pn)) // (patchName)=>Either<Directory>
		.map(dir => bp.parseBitmap(wadBytes)(dir)); // (Either<Directory>)=> Either<PatchBitmap>

	return Either.ofTruth([patchName, bitmap], () => ({
		originX: shortParser(offset),
		originY: shortParser(offset + 0x02),
		patchIdx,
		patchName: patchName.get(),
		bitmap: bitmap.get()
	}));
};

const findPatchDir = (dirs: Directory[]) => (patchName: string): Either<Directory> =>
	dp.findDirectoryByName(dirs)(patchName);

const parsePatches = (wadBytes: number[], dirs: Directory[]): PatchBitmap[] => {
	const patchDirFinder = findPatchDir(dirs);
	const bitmapParser = bp.parseBitmap(wadBytes);
	return parsePnames(wadBytes, dirs).names
		.map(pn => patchDirFinder(pn)) // (dirName)=> Either<Directory>
		.filter(d => d.isRight()).map(d => d.get()) // (Either<Directory>)=>Directory
		.map(d => bitmapParser(d)).filter(b => b.isRight()).map(b => b.get()); // (Directory) => PatchBitmap
};

// ############################ EXPORTS ############################
export const testFunctions = {findPatchDir,parsePnames};
export const functions = {parseTextures, parsePatches};
