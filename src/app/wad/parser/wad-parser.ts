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
import {Directories, Directory, Palette, TitlePic, Wad} from './wad-model';
import {Either} from '../../common/either';
import {functions as dp} from './directory-parser';
import {functions as mp} from './map-parser';
import {functions as tp} from './texture-parser';
import {functions as bp} from './bitmap-parser';
import {functions as pp} from './playpal-parser';

const parseTitlePic = (bytes: number[], dirs: Directory[], palette: Palette): Either<TitlePic> => {
	const find = dp.findDirectoryByName(dirs);
	const title = find(Directories.TITLEPIC).map(d => bp.parseBitmap(bytes, palette)(d));
	const credit = find(Directories.CREDIT).map(d => bp.parseBitmap(bytes, palette)(d));
	const md = find(Directories.M_DOOM).map(d => bp.parseBitmap(bytes, palette)(d));
	const help = Either.ofEitherArray(find('HELP1')
		.map(d => bp.parseBitmap(bytes, palette)(d)), find('HELP2')
		.map(d => bp.parseBitmap(bytes, palette)(d)));

	return Either.ofCondition(() => title.isRight() && credit.isRight() && credit.isRight(),
		() => 'Image Folders not found', () => ({
			help,
			title: title.get(),
			credit: credit.get(),
			mDoom: md.get()
		}));
};

// TODO all wrapped methods: Either.ofRight should return Either
const parseWad = (bytes: number[]): Either<Wad> =>
	dp.parseHeader(bytes)
		.map(header => ({header, bytes}))// header + bytes
		.append(w => dp.parseAllDirectories(w.header, bytes), (w, v) => w.dirs = v) // dirs
		.append(w => Either.ofRight(tp.parsePnames(bytes, w.dirs)), (w, v) => w.pnames = v) // pnames
		.append(w => Either.ofRight(pp.parsePlaypal(bytes, w.dirs)), (w, v) => w.playpal = v) // playpal
		.append(w => parseTitlePic(bytes, w.dirs, w.playpal.palettes[0]), (w, v) => w.title = v)// title
		.append(w => Either.ofRight(tp.parsePatches(bytes, w.dirs, w.playpal.palettes[0])), (w, v) => w.patches = v)// patches
		.append(w => tp.parseTextures(bytes, w.dirs, w.pnames, w.patches), (w, v) => w.textures = v) // textures
		.append(w => mp.parseMaps(bytes, w.dirs, w.textures), (w, v) => w.maps = v); // maps

// ############################ EXPORTS ############################
export const testFunctions = {
	parseTitlePic
};

export const functions = {
	parseWad
};
