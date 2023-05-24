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
import {Directories, Directory, Palette, TitlePic, Wad} from './wad-model'
import {Either, LeftType} from '../../common/either'
import {functions as DP} from './directory-parser'
import {functions as MP} from './map-parser'
import {functions as TP} from './texture-parser'
import {functions as BP} from './bitmap-parser'
import {functions as PP} from './playpal-parser'

const parseTitlePic = (bytes: number[], dirs: Directory[], palette: Palette): Either<TitlePic> => {
	const find = DP.findDirectoryByName(dirs)
	const title = find(Directories.TITLEPIC).map(d => BP.parseBitmap(bytes, palette)(d))
	const credit = find(Directories.CREDIT).map(d => BP.parseBitmap(bytes, palette)(d))
	const md = find(Directories.M_DOOM).map(d => BP.parseBitmap(bytes, palette)(d))
	const help = Either.ofEitherArray(find('HELP1')
		.map(d => BP.parseBitmap(bytes, palette)(d)), find('HELP2')
		.map(d => BP.parseBitmap(bytes, palette)(d)))

	return Either.ofCondition(() => title.isRight() && credit.isRight() && credit.isRight(),
		() => 'Image Folders not found', () => ({
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
		.append(w => MP.parseMaps(bytes, w.dirs, w.textures, w.flatBitmaps), (w, v) => w.maps = v); // maps

// ############################ EXPORTS ############################
export const testFunctions = {
	parseTitlePic
}

export const functions = {
	parseWad
}
