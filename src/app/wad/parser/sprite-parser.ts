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
import {Bitmap, BitmapSprite, Directories, Directory, FrameDir, Palette, Sprite} from './wad-model'
import {Either, LeftType} from '../../common/either'
import {functions as DP} from './directory-parser'
import {functions as BP} from './bitmap-parser'
import * as R from 'ramda'
import {getPalette} from './testdata/data'

const findStartDir = (dirs: Directory[]): Either<Directory> => DP.findDirectoryByName(dirs)(Directories.S_START)

const findEndDir = (dirs: Directory[], offset: number): Either<Directory> => DP.findDirectoryByOffset(dirs)(Directories.S_END, offset)

const findSpriteDirs = (dirs: Directory[]): Directory[] => {
	const startDir: Directory = findStartDir(dirs).get()
	const endDir: Directory = findEndDir(dirs, startDir.idx).get()
	return dirs.slice(startDir.idx + 1, endDir.idx)
}

/** #sprites contains only Dirs declaring sprites. */
const groupDirsBySpriteName = (sprites: Directory[]): Directory[][] => {
	const sorted = R.sortBy(parseDirSpriteName)(sprites); // sort by #sectorId in order to be able to group by it
	return R.groupWith((d1: Directory, d2: Directory) => parseDirSpriteName(d1) === parseDirSpriteName(d2))(sorted)
}

const parseDirSpriteName = (dir: Directory): string => dir.name.substr(0, 4)
const parseDirFrameName = (dir: Directory): string => dir.name.substr(4, 1)
const parseDirAngle = (dir: Directory): number => Number(dir.name.substr(5, 1))
const parseDirMirrorFrameName = (dir: Directory): string => dir.name.substr(6, 1)
const parseDirMirrorAngle = (dir: Directory): number => Number(dir.name.substr(7, 1))
const hasMirrorFrame = (dir: Directory): number => Number(dir.name.length === 8)

/** #dirs contains all dirs for single sprite */
const toFrameDirs = (wadBytes: number[], palette: Palette) => (dirs: Directory[]): FrameDir[] => {
	const fd: FrameDir[] = dirs.map(toFrameDir(wadBytes, palette))
	const fdMirror: FrameDir[] = dirs.filter(hasMirrorFrame).map(toMirrorFrameDir(wadBytes, palette))
	return fd.concat(fdMirror)
}

const toFrameDir = (wadBytes: number[], palette: Palette) => (dir: Directory): FrameDir => {
	return {
		frameName: parseDirFrameName(dir),
		spriteName: parseDirSpriteName(dir),
		dir,
		angle: parseDirAngle(dir),
		mirror: false,
		bitmap: BP.parseBitmap(wadBytes, palette)(dir)
	}
}

const toMirrorFrameDir = (wadBytes: number[], palette: Palette) => (dir: Directory): FrameDir => {
	return {
		frameName: parseDirMirrorFrameName(dir),
		spriteName: parseDirSpriteName(dir),
		dir,
		angle: parseDirMirrorAngle(dir),
		mirror: true,
		bitmap: BP.parseBitmap(wadBytes, palette)(dir)
	}
}

/** #dirs contains all dirs for single sprite */
const toFramesByAngle = (dirs: FrameDir[]): Record<string, FrameDir[]> =>
	R.groupBy((d: FrameDir) => d.angle.toString())(dirs)

/** K: Sprite's name, V: the Sprite */
const parseSpritesAsArray = (wadBytes: number[], dirs: Directory[]): Sprite[] => {
	return groupDirsBySpriteName(findSpriteDirs(dirs)).map(toFrameDirs(wadBytes, getPalette())).map(frames => {
		const animations = toFramesByAngle(frames)
		const name = frames[0].spriteName
		return toBitmapSprites(name, animations).map(bitmaps => ({name, animations, bitmaps}))
	}).filter(bs => bs.isRight()).map(bs => bs.get())
}

/** K: Sprite's name, V: the Sprite */
const parseSpritesAsMap = (wadBytes: number[], dirs: Directory[]): Record<string, Sprite> =>
	R.mapAccum((acc: {}, s: Sprite) => [acc, acc[s.name] = s], {}, parseSpritesAsArray(wadBytes, dirs))[0]

const toBitmapSprites = (name: string, animations: Record<string, FrameDir[]>): Either<BitmapSprite[]> => {
	const sprites = Object.keys(animations).map(angle => animations[angle]).map((d: FrameDir[]) => toBitmapSprite(d))
		.filter(md => md.isRight()).map(md => md.get())
	return Either.ofCondition(() => sprites.length > 0, () => name + ' has no sprites', () => sprites, LeftType.WARN)
}

const toBitmapSprite = (frame: FrameDir[]): Either<BitmapSprite> => {
	const frames: Bitmap[] = frame.filter(f => f.bitmap.isRight()).map(f => f.bitmap.get())
	const first = frame[0]
	return Either.ofCondition(() => frames.length > 0, () => first.spriteName + ' has no frames', () => ({
		name: first.spriteName,
		angle: first.angle.toString(),
		frames
	}))
}

const maxSpriteSize = (sprite: BitmapSprite): number => Math.max(
	sprite.frames.map(s => s.header.width).reduce((prev, cur) => prev > cur ? prev : cur),
	sprite.frames.map(s => s.header.height).reduce((prev, cur) => prev > cur ? prev : cur))

const calcScale = (maxScale: number) => (sprite: BitmapSprite): number => {
	const scale = maxScale / maxSpriteSize(sprite)
	return scale - scale % 1
}

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
	toFrameDirs,
	maxSpriteSize,
	calcScale,
	toBitmapSprite,
	toBitmapSprites
}

export const functions = {
	parseSpritesAsMap,
	parseSpritesAsArray,
	calcScale,
	toBitmapSprites
}

