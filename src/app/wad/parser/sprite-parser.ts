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
import {Bitmap, BitmapHeader, Directories, Directory, Frame, Palette, Sprite} from './wad-model'
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
	const sorted = R.sortBy(parseSpriteName)(sprites) // sort by sprite name in order to be able to group by it
	return R.groupWith((d1: Directory, d2: Directory) => parseSpriteName(d1) === parseSpriteName(d2))(sorted)
}

const parseSpriteName = ({name}: Directory): string => name.substring(0, 4)
const parseFrameName = ({name}: Directory): string => name.substring(4, 5)
const parseRotation = ({name}: Directory): number => Number(name.substring(5, 6))
const parseMirrorFrameName = ({name}: Directory): string => name.substring(6, 7)
const parseMirrorRotation = ({name}: Directory): number => Number(name.substring(7, 8))
const isMirrorFrame = ({name}: Directory): boolean => name.length === 8

/** #dirs contains all dirs for single sprite */
const toFrames = (wadBytes: number[], palette: Palette) => (dirs: Directory[]): Frame[] => {
	const fd = dirs.map(toMainFrame(wadBytes, palette))
	const fdMirror = dirs.filter(isMirrorFrame).map(toMirrorFrame(wadBytes, palette))
	return fd.concat(fdMirror).filter(f => f.filter(LeftType.WARN)).map(f => f.get())
}

const findMaxWidth = (hd: BitmapHeader[]): number => findMax(hh => hh.width, hd)
const findMaxHeight = (hd: BitmapHeader[]): number => findMax(hh => hh.height, hd)

const findMax = (mf: (fr: BitmapHeader) => number, frames: BitmapHeader[]) =>
	R.reduce<number, number>(R.max, -Infinity, frames.map(fr => mf(fr)))

/** K: Sprite's name, V: the Sprite */
const parseSprites = (wadBytes: number[], dirs: Directory[]): Record<string, Sprite> => {
	const sprites = groupDirsBySpriteName(findSpriteDirs(dirs)).map(toFrames(wadBytes, getPalette()))
		// #fs contains all frames for a single sprite
		.map(fs => {
			const name = fs[0].spriteName
			const frames: Record<string, Frame[]> = R.groupBy<Frame>(fr => fr.frameName)(fs)
			const sprite: Sprite = {
				name,
				frames,
				maxWidth: findMaxWidth(fs.map(e => e.bitmap.header)),
				maxHeight: findMaxHeight(fs.map(e => e.bitmap.header))
			}
			return Either.ofRight(sprite)
		}).filter(bs => bs.filter(LeftType.WARN)).map(bs => bs.get())

	return R.reduce(
		(rec, sp: Sprite) => {
			rec[sp.name] = sp
			return rec
		}, {}, sprites)
}

const toMainFrame = (wadBytes: number[], palette: Palette) => (dir: Directory): Either<Frame> =>
	BP.parseBitmap(wadBytes, palette)(dir).map(bitmap => ({
		spriteName: parseSpriteName(dir),
		frameName: parseFrameName(dir),
		rotation: parseRotation(dir),
		dir,
		bitmap
	}))

const toMirrorFrame = (wadBytes: number[], palette: Palette) => (dir: Directory): Either<Frame> =>
	BP.parseBitmap(wadBytes, palette)(dir).map(bitmap => ({// TODO mirror/rotate bitmap
		spriteName: parseSpriteName(dir),
		frameName: parseMirrorFrameName(dir),
		rotation: parseMirrorRotation(dir),
		dir,
		bitmap
	}))

const spriteToBitmaps = (sprite: Sprite): Bitmap[] =>
	Object.values(sprite.frames).flat().map(fr => fr.bitmap)

const maxSpriteSize = (sprite: Sprite): number => {
	const sb = spriteToBitmaps(sprite)
	return Math.max(
		sb.map(s => s.header.width).reduce((prev, cur) => prev > cur ? prev : cur),
		sb.map(s => s.header.height).reduce((prev, cur) => prev > cur ? prev : cur))
}

const calcScale = (maxScale: number) => (sprite: Sprite): number => {
	const scale = maxScale / maxSpriteSize(sprite)
	return scale - scale % 1
}

// ############################ EXPORTS ############################
export const testFunctions = {
	findStartDir,
	findEndDir,
	groupDirsBySpriteName,
	findSpriteDirs,
	maxSpriteSize,
	calcScale,
	parseSpriteName,
	parseFrameName,
	parseRotation,
	parseMirrorRotation,
	hasMirrorFrame: isMirrorFrame,
	parseMirrorFrameName,
	toMainFrame,
	toMirrorFrame,
	findMaxWidth,
	findMaxHeight
}

export const functions = {
	calcScale,
	parseSprites
}

