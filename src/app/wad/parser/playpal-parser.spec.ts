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
import {functions as tp, testFunctions as tf} from './playpal-parser';
import {getAllDirs, getWadBytes} from './testdata/data';

describe('playpal-parser#parseRBG', () => {
	const parse = tf.parseRBG([1, 2, 3, 44, 55, 66]);
	it('parse at 0', () => {
		expect(parse(0)).toEqual({r: 1, g: 2, b: 3, a: 255});
	});

	it('parse at 1', () => {
		expect(parse(1)).toEqual({r: 2, g: 3, b: 44, a: 255});
	});

	it('parse at 3', () => {
		expect(parse(3)).toEqual({r: 44, g: 55, b: 66, a: 255});
	});
});

describe('playpal-parser#parsePlaypal', () => {
	const playpal = tp.parsePlaypal(getWadBytes(), getAllDirs());

	it('palettes amount', () => {
		expect(playpal.palettes.length).toEqual(13);
	});

	it('palette colors', () => {
		playpal.palettes.forEach(palette => {
				expect(palette.colors.length).toEqual(256);
			}
		);
	});

	it('palette - color value', () => {
		playpal.palettes.forEach(palette => {
				palette.colors.forEach(col => {
					expect(col.r).toBeLessThanOrEqual(255);
					expect(col.r).toBeGreaterThanOrEqual(0);
				});
			}
		);
	});

	it('palette[0] - few random colors', () => {
		const palette = playpal.palettes[0].colors;
		expect(palette[0]).toEqual({r: 0, g: 0, b: 0, a: 255});
		expect(palette[4]).toEqual({r: 255, g: 255, b: 255, a: 255});
		expect(palette[10]).toEqual({r: 35, g: 43, b: 15, a: 255});
		expect(palette[31]).toEqual({r: 163, g: 59, b: 59, a: 255});
	});
});
