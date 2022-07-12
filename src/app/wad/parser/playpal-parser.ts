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
import {Directories, Directory, Palette, Playpal, RGBA} from './wad-model';
import * as R from 'ramda';
import {functions as dp} from './directory-parser';

const RBG_BYTES = 3;
const PLAYPAL_COLORS = 256;
const PLAYPAL_BYTES = RBG_BYTES * 256;

/*
 * @see https://doomwiki.org/wiki/COLORMAP
 * @see https://doomwiki.org/wiki/PLAYPAL
 */
const parseRBG = (bytes: number[]) => (idx: number): RGBA => {
	return {
		r: bytes[idx],
		g: bytes[idx + 1],
		b: bytes[idx + 2],
		a: 255
	};
};

const parsePalette = (paletteBytes: number[], dir: Directory) => (paletteNumber: number): Palette => {
	const parseRBGBytes = parseRBG(paletteBytes);
	const bytesOffset = dir.filepos + paletteNumber * PLAYPAL_BYTES;
	const colors = R.range(0, PLAYPAL_COLORS).map(idx => parseRBGBytes(bytesOffset + idx * 3));
	return {colors, idx: paletteNumber};
};

const parsePlaypal = (wadBytes: number[], dirs: Directory[]): Playpal => {
	const dir = dp.findDirectoryByName(dirs)(Directories.PLAYPAL).get();
	const paletteParser = parsePalette(wadBytes, dir);
	const palettes = R.range(0, 13).map(idx => paletteParser(idx));
	return {dir, palettes};
};

// ############################ EXPORTS ############################
export const testFunctions = {
	parsePalette,
	parseRBG,
};
export const functions = {
	parsePlaypal,
};
