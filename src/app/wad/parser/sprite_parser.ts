import {AngleDir, Directories, Directory, FrameDir} from './wad_model';
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

/** #sprites contains only Dirs declaring sprites. */
const groupDirsBySpriteName = (sprites: Directory[]): Record<string, Directory[]> => {
	return R.groupBy(parseDirSpriteName)(sprites);
};

const parseDirSpriteName = (dir: Directory): string => dir.name.substr(0, 4);
const parseDirFrameName = (dir: Directory): string => dir.name.substr(4, 1);
const parseDirAngle = (dir: Directory): number => Number(dir.name.substr(5, 1));
const parseDirMirrorFrameName = (dir: Directory): string => dir.name.substr(6, 1);
const parseDirMirrorAngle = (dir: Directory): number => Number(dir.name.substr(7, 1));
const hasMirrorFrame = (dir: Directory): number => Number(dir.name.length === 8);


/** #dirs contains all dirs for single sprite */
const toFrameDirs = (dirs: Directory[]): FrameDir[] => {
	const fd: FrameDir[] = dirs.map(toFrameDir);
	const fdMirror: FrameDir[] = dirs.filter(hasMirrorFrame).map(toMirrorFrameDir);
	return fd.concat(fdMirror);
};

const toFrameDir = (dir: Directory): FrameDir => {
	return {
		frame: parseDirFrameName(dir),
		dir,
		angle: parseDirAngle(dir),
		mirror: false
	};
};

const toMirrorFrameDir = (dir: Directory): FrameDir => {
	return {
		frame: parseDirMirrorFrameName(dir),
		dir,
		angle: parseDirMirrorAngle(dir),
		mirror: true
	};
};

// https://ramdajs.com/docs/#reduceBy
/** #dirs contains all dirs for single sprite */
const toDirsByAngle = (dirs: FrameDir[]): AngleDir[] => {
	const byAngle: Record<number, FrameDir[]> = R.groupBy((d: FrameDir) => d.angle.toString())(dirs);
	return Object.entries(byAngle).map(e => ({angle: Number(e[0]), frames: e[1]}));
};


// ############################ EXPORTS ############################
export const testFunctions = {
	findStartDir,
	findEndDir,
	groupDirsBySpriteName,
	findSpriteDirs,
	toDirsByAngle,
	parseDirSpriteName,
	parseDirFrameName,
	parseDirAngle,
	parseDirMirrorFrameName,
	parseDirMirrorAngle,
	hasMirrorFrame,
	toFrameDirs
};

