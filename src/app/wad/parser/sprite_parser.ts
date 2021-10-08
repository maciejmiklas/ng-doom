import {Directories, Directory} from './wad_model';
import {Either} from '@maciejmiklas/functional-ts';
import {functions as dp} from './directory_parser';
import * as R from 'ramda';

const findStartDir = (dirs: Directory[]): Either<Directory> => dp.findDirectoryByName(dirs)(Directories.S_START);

const findEndDir = (dirs: Directory[], offset: number): Either<Directory> => dp.findDirectoryByOffset(dirs)(Directories.S_END, offset);

const findSpriteDirs = (dirs: Directory[]): Directory[] => {
	const startDir: Directory = findStartDir(dirs).get();
	const endDir: Directory = findEndDir(dirs, startDir.idx).get();
	return dirs.slice(startDir.idx + 1, endDir.idx);
};

// https://ramdajs.com/docs/#reduceBy
const groupDirsBySpriteName = (dirs: Directory[]): Record<string, Directory[]> => {
	const sprites: Directory[] = findSpriteDirs(dirs);
	return R.groupBy((d: Directory) => d.name.substr(0, 4))(sprites);
};


// ############################ EXPORTS ############################
export const testFunctions = {
	findStartDir,
	findEndDir,
	groupDirsBySpriteName,
	findSpriteDirs,
};
