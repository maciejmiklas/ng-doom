/*
 * Copyright 2022 Maciej Miklas (MIT License)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import {Directories, Directory, Palette, TitlePic, Wad} from './wad-model'
import {Either, LeftType} from '../../common/either'
import {functions as DP} from './directory-parser'
import {functions as MP} from './map-parser'
import {functions as TP} from './texture-parser'
import {functions as BP} from './bitmap-parser'
import {functions as PP} from './playpal-parser'
import {functions as SP} from './sprite-parser'

const parseTitlePic = (bytes: number[], dirs: Directory[], palette: Palette): Either<TitlePic> => {
	const find = DP.findDirectoryByName(dirs)
	const title = find(Directories.TITLEPIC).map(d => BP.parseBitmap(bytes, palette)(d))
	const credit = find(Directories.CREDIT).map(d => BP.parseBitmap(bytes, palette)(d))
	const md = find(Directories.M_DOOM).map(d => BP.parseBitmap(bytes, palette)(d))
	const help = Either.ofEitherArray(find('HELP1')
		.map(d => BP.parseBitmap(bytes, palette)(d)), find('HELP2')
		.map(d => BP.parseBitmap(bytes, palette)(d)))

	return Either.ofTruth([title, credit, md], () => ({
		help,
		title: title.get(),
		credit: credit.get(),
		mDoom: md.get()
	}), LeftType.WARN)
}

const parseWad = (bytes: number[]): Either<Wad> =>
	DP.parseHeader(bytes)
		.map(header => ({header, bytes}))// header + bytes
		.append(w => DP.parseAllDirectories(w.header, bytes), (w, v) => w.dirs = v) // dirs
		.append(w => TP.parsePnames(bytes, w.dirs), (w, v) => w.pnames = v) // pnames
		.append(w => PP.parsePlaypal(bytes, w.dirs), (w, v) => w.playpal = v) // playpal
		.append(w => Either.ofRight(w.playpal.palettes[0]), (w, v) => w.palette = v) // palette
		.append(w => parseTitlePic(bytes, w.dirs, w.palette), (w, v) => w.title = v)// title
		.append(w => TP.parsePatches(bytes, w.dirs, w.palette, w.pnames), (w, v) => w.patches = v)// patches
		.append(w => TP.parseTextures(bytes, w.dirs, w.pnames, w.patches), (w, v) => w.textures = v) // textures
		.append(w => TP.parseFlats(bytes, w.dirs, w.palette), (w, v) => w.flatBitmaps = v) // flatBitmaps
		.append(w => Either.ofRight(SP.parseSprites(bytes, w.dirs)), (w, v) => w.sprites = v) // Sprites
		.append(w => MP.parseMaps(bytes, w.dirs, w.textures, w.flatBitmaps), (w, v) => w.maps = v) // maps

// ############################ EXPORTS ############################
export const testFunctions = {
	parseTitlePic
}

export const functions = {
	parseWad
}
