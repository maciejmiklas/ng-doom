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
import {functions as mf} from './wad-model';
import {pathClosedMixed2} from "./testdata/data";

describe('wad_model#vertexEqual', () => {
	it('Equal', () => {
		const v1 = {x: 2, y: 3}
		const v2 = {x: 2, y: 3}
		expect(mf.vertexEqual(v1, v2)).toBeTrue();
	});

	it('Not Equal', () => {
		const v1 = {x: 2, y: 3}
		const v2 = {x: 22, y: 3}
		expect(mf.vertexEqual(v1, v2)).toBeFalse();
	});
});

describe('wad_model#reverseVector', () => {

	it('reverse', () => {
		const val = {"start": {"x": 700, "y": 800}, "end": {"x": 500, "y": 600}};
		const reversed = mf.reverseVector(val);

		expect(val.start.x).toEqual(700);
		expect(reversed.start.x).toEqual(500);

		expect(val.end.x).toEqual(500);
		expect(reversed.end.x).toEqual(700);
	});

});

describe('wad_model#pathToPoints', () => {

	it('Continuous path', () => {
		const points = mf.pathToPoints(pathClosedMixed2);
		expect(points.length).toEqual(5);

		const val = new Set();
		points.forEach(p => {
				const value = p.x + "-" + p.y;
				expect(val.has(value)).toBeFalse();
				val.add(value);
			}
		)
	});

});




