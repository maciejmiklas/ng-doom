import {Directories, Directory, FrameDir, Sprite} from './wad-model';
import {Either} from '@maciejmiklas/functional-ts';
import {functions as dp} from './directory-parser';
import * as R from 'ramda';
import {functions as bp} from './bitmap-parser';

const findStartDir = (dirs: Directory[]): Either<Directory> => dp.findDirectoryByName(dirs)(Directories.S_START);

const findEndDir = (dirs: Directory[], offset: number): Either<Directory> => dp.findDirectoryByOffset(dirs)(Directories.S_END, offset);

const findSpriteDirs = (dirs: Directory[]): Directory[] => {
	const startDir: Directory = findStartDir(dirs).get();
	const endDir: Directory = findEndDir(dirs, startDir.idx).get();
	return dirs.slice(startDir.idx + 1, endDir.idx);
};

/** #sprites contains only Dirs declaring sprites. */
const groupDirsBySpriteName = (sprites: Directory[]): Directory[][] => {
	const sorted = R.sortBy(parseDirSpriteName)(sprites); // sort by #sectorId in order to be able to group by it
	return R.groupWith((d1: Directory, d2: Directory) => parseDirSpriteName(d1) === parseDirSpriteName(d2))(sorted);
}

const parseDirSpriteName = (dir: Directory): string => dir.name.substr(0, 4);
const parseDirFrameName = (dir: Directory): string => dir.name.substr(4, 1);
const parseDirAngle = (dir: Directory): number => Number(dir.name.substr(5, 1));
const parseDirMirrorFrameName = (dir: Directory): string => dir.name.substr(6, 1);
const parseDirMirrorAngle = (dir: Directory): number => Number(dir.name.substr(7, 1));
const hasMirrorFrame = (dir: Directory): number => Number(dir.name.length === 8);

/** #dirs contains all dirs for single sprite */
const toFrameDirs = (wadBytes: number[]) => (dirs: Directory[]): FrameDir[] => {
	const fd: FrameDir[] = dirs.map(toFrameDir(wadBytes));
	const fdMirror: FrameDir[] = dirs.filter(hasMirrorFrame).map(toMirrorFrameDir(wadBytes));
	return fd.concat(fdMirror);
};

const toFrameDir = (wadBytes: number[]) => (dir: Directory): FrameDir => {
	return {
		frameName: parseDirFrameName(dir),
		spriteName: parseDirSpriteName(dir),
		dir,
		angle: parseDirAngle(dir),
		mirror: false,
		bitmap: bp.parseBitmap(wadBytes)(dir)
	};
};

const toMirrorFrameDir = (wadBytes: number[]) => (dir: Directory): FrameDir => {
	return {
		frameName: parseDirMirrorFrameName(dir),
		spriteName: parseDirSpriteName(dir),
		dir,
		angle: parseDirMirrorAngle(dir),
		mirror: true,
		bitmap: bp.parseBitmap(wadBytes)(dir)
	};
};

/** #dirs contains all dirs for single sprite */
const toFramesByAngle = (dirs: FrameDir[]): Record<string, FrameDir[]> =>
	R.groupBy((d: FrameDir) => d.angle.toString())(dirs);

/** K: Sprite's name, V: the Sprite */
const parseSpritesAsArray = (wadBytes: number[], dirs: Directory[]): Sprite[] => {
	return groupDirsBySpriteName(findSpriteDirs(dirs)).map(toFrameDirs(wadBytes)).map(frames => {
		return {name: frames[0].spriteName, animations: toFramesByAngle(frames)};
	});
};

/** K: Sprite's name, V: the Sprite */
const parseSpritesAsMap = (wadBytes: number[], dirs: Directory[]): Record<string, Sprite> =>
	R.mapAccum((acc: {}, s: Sprite) => [acc, acc[s.name] = s], {}, parseSpritesAsArray(wadBytes, dirs))[0];

// ############################ EXPORTS ############################
export const testFunctions = {
	findStartDir,
	findEndDir,
	groupDirsBySpriteName,
	findSpriteDirs,
	toFramesByAngle,
	parseDirSpriteName,
	parseDirFrameName,
	parseDirAngle,
	parseDirMirrorFrameName,
	parseDirMirrorAngle,
	hasMirrorFrame,
	toFrameDirs
};

export const functions = {
	parseSpritesAsMap,
	parseSpritesAsArray
};

