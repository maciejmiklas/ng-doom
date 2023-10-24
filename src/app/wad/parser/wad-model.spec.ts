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
import {functions as MF, VectorConnection, VectorV} from './wad-model'
import {
	E1M1_S39, E1M1_S72,
	E1M3_S7, E1M5_S18,
	PATH_CLOSED_1,
	PATH_CLOSED_MIXED_2,
	PATH_CLOSED_REVERSED_ONE,
	PATH_CROSSING_MIXED, POLY_01_A, POLY_01_G
} from "./testdata/data"
import {testFunctions as TF} from "./flat-builder";


describe('wad-model#vertexEqual', () => {
	it('Equal', () => {
		const v1 = {x: 2, y: 3}
		const v2 = {x: 2, y: 3}
		expect(MF.vertexEqual(v1, v2)).toBeTrue()
	})

	it('Not Equal', () => {
		const v1 = {x: 2, y: 3}
		const v2 = {x: 22, y: 3}
		expect(MF.vertexEqual(v1, v2)).toBeFalse()
	})
})

describe('wad-model#reverseVector', () => {

	it('reverse', () => {
		const val = {"start": {"x": 700, "y": 800}, "end": {"x": 500, "y": 600}}
		const reversed = MF.reverseVector(val)

		expect(val.start.x).toEqual(700)
		expect(reversed.start.x).toEqual(500)

		expect(val.end.x).toEqual(500)
		expect(reversed.end.x).toEqual(700)
	})

})

describe('wad-model#pathToPoints', () => {

	it('Continuous path', () => {
		const points = MF.pathToPoints(PATH_CLOSED_MIXED_2)
		expect(points.length).toEqual(5)

		const val = new Set()
		points.forEach(p => {
				const value = p.x + "-" + p.y
				expect(val.has(value)).toBeFalse()
				val.add(value)
			}
		)
	})

	it('Continuous path 1', () => {
		const points = MF.pathToPoints(PATH_CLOSED_1)
		expect(points.length).toEqual(4)

		const val = new Set()
		points.forEach(p => {
				const value = p.x + "-" + p.y
				expect(val.has(value)).toBeFalse()
				val.add(value)
			}
		)
	})
})

describe('wad-model#hasVertex', () => {
	const vector: VectorV = {start: {x: 2, y: 4}, end: {x: 2, y: 4}}

	it('has vertex', () => {
		expect(MF.hasVertex({x: 2, y: 4})(vector)).toBeTrue()
	})

	it('has no vertex', () => {
		expect(MF.hasVertex({x: 4, y: 4})(vector)).toBeFalse()
	})
})

describe('wad-model#vectorsEqual', () => {

	it('Equal - the same', () => {
		const v1 = {start: {x: 1, y: 2}, end: {x: 4, y: 5}}
		const v2 = {start: {x: 1, y: 2}, end: {x: 4, y: 5}}
		expect(MF.vectorsEqual(v1, v2)).toBeTrue()
	})

	it('Equal - reversed', () => {
		const v1 = {start: {x: 1, y: 2}, end: {x: 4, y: 5}}
		const v2 = {start: {x: 4, y: 5}, end: {x: 1, y: 2}}
		expect(MF.vectorsEqual(v1, v2)).toBeTrue()
	})

	it('Not equal', () => {
		const v1 = {start: {x: 1, y: 22}, end: {x: 4, y: 5}}
		const v2 = {start: {x: 1, y: 2}, end: {x: 4, y: 5}}
		expect(MF.vectorsEqual(v1, v2)).toBeFalse()
	})
})

describe('wad-model#vectorsConnected', () => {
	it('Connected - the same', () => {
		const v1 = {start: {x: 1, y: 2}, end: {x: 4, y: 5}}
		const v2 = {start: {x: 1, y: 2}, end: {x: 4, y: 5}}
		expect(MF.vectorsConnected(v1, v2)).toEqual(VectorConnection.V1START_TO_V2END)
	})

	it('Connected - start to start', () => {
		const v1 = {start: {x: 1, y: 2}, end: {x: 4, y: 5}}
		const v2 = {start: {x: 1, y: 2}, end: {x: 43, y: 54}}
		expect(MF.vectorsConnected(v1, v2)).toEqual(VectorConnection.V1START_TO_V2START)
	})

	it('Connected - start to end', () => {
		const v1 = {start: {x: 1, y: 2}, end: {x: 34, y: 45}}
		const v2 = {start: {x: 1, y: 2}, end: {x: 1, y: 2}}
		expect(MF.vectorsConnected(v1, v2)).toEqual(VectorConnection.V1START_TO_V2END)
	})

	it('Connected - end to end', () => {
		const v1 = {start: {x: 41, y: 42}, end: {x: 4, y: 5}}
		const v2 = {start: {x: 10, y: 20}, end: {x: 4, y: 5}}
		expect(MF.vectorsConnected(v1, v2)).toEqual(VectorConnection.V1END_TO_V2END)
	})

	it('Connected - end to start', () => {
		const v1 = {start: {x: 21, y: 12}, end: {x: 4, y: 5}}
		const v2 = {start: {x: 4, y: 5}, end: {x: 4, y: 5}}
		expect(MF.vectorsConnected(v1, v2)).toEqual(VectorConnection.V1END_TO_V2START)
	})

	it('Connected - end to end 2', () => {
		const v1 = {start: {x: 33, y: 4}, end: {x: 4, y: 5}}
		const v2 = {start: {x: 10, y: 20}, end: {x: 4, y: 5}}
		expect(MF.vectorsConnected(v1, v2)).toEqual(VectorConnection.V1END_TO_V2END)
	})

	it('Not connected', () => {
		const v1 = {start: {x: 122, y: 222}, end: {x: 444, y: 5}}
		const v2 = {start: {x: 11, y: 12}, end: {x: 14, y: 15}}
		expect(MF.vectorsConnected(v1, v2)).toEqual(VectorConnection.NONE)
	})
})

describe('wad-model#vectorReversed', () => {

	it('In path', () => {
		expect(MF.vectorReversed(PATH_CLOSED_REVERSED_ONE)(
			{"start": {"x": 700, "y": 800}, "end": {"x": 10, "y": 20}})).toBeFalse()
	})

	it('Not in path', () => {
		expect(MF.vectorReversed(PATH_CLOSED_REVERSED_ONE)(
			{"start": {"x": 700, "y": 800}, "end": {"x": 500, "y": 600}})).toBeTrue()
	})

})

describe('wad-model#countVertex', () => {

	it('found 4', () => {
		expect(MF.countVertex(PATH_CROSSING_MIXED)({"x": 928, "y": -3104})).toEqual(4)
	})

	it('found 0', () => {
		expect(MF.countVertex(PATH_CROSSING_MIXED)({"x": 928, "y": 3360})).toEqual(0)
	})

})

describe('wad-model#uniqueVertex', () => {

	it('count', () => {
		expect(MF.uniqueVertex(PATH_CLOSED_MIXED_2).length).toEqual(PATH_CLOSED_MIXED_2.length)
	})

	it('no duplicates', () => {
		const unique = MF.uniqueVertex(PATH_CLOSED_MIXED_2)
		unique.forEach(v => {
			let cnt = 0
			unique.forEach(vv => {
				if (MF.vertexEqual(v, vv)) {
					cnt++
				}
			})
			expect(cnt).withContext(JSON.stringify(v)).toEqual(1)
		})
	})
})

describe('wad-model#hasAction', () => {

	it('no action: special type = 0', () => {
		expect(MF.hasAction({
			"id": 988,
			"start": {"x": -1552, "y": -2640},
			"end": {"x": -1408, "y": -2944},
			specialType: 0
		})).toBeFalse()
	})

	it('no action: special type not set', () => {
		expect(MF.hasAction({
			"id": 988,
			"start": {"x": -1552, "y": -2640},
			"end": {"x": -1408, "y": -2944}
		})).toBeFalse()
	})

	it('action: special type = 2', () => {
		expect(MF.hasAction({
			"id": 988,
			"start": {"x": -1552, "y": -2640},
			"end": {"x": -1408, "y": -2944},
			specialType: 2
		})).toBeTrue()
	})
})

describe('map-parser#findMinX', () => {
	it('positive', () => {
		expect(MF.findMinX(PATH_CROSSING_MIXED)).toEqual(896)
	})

	it('negative', () => {
		expect(MF.findMinX(E1M3_S7)).toEqual(-640)
	})
})

describe('map-parser#findMaxX', () => {
	it('positive 1', () => {
		expect(MF.findMaxX(PATH_CROSSING_MIXED)).toEqual(1184)
	})

	it('positive 2', () => {
		expect(MF.findMaxX(E1M3_S7)).toEqual(288)
	})
})

describe('map-parser#findMinY', () => {
	it('negative', () => {
		expect(MF.findMinY(PATH_CROSSING_MIXED)).toEqual(-3392)
	})

	it('positive', () => {
		expect(MF.findMinY(PATH_CLOSED_REVERSED_ONE)).toEqual(20)
	})
})

describe('map-parser#findMaxY', () => {
	it('negative', () => {
		expect(MF.findMaxY(PATH_CROSSING_MIXED)).toEqual(-3072)
	})

	it('positive', () => {
		expect(MF.findMaxY(PATH_CLOSED_REVERSED_ONE)).toEqual(800)
	})
})

describe('map-parser#findMax', () => {
	it('positive', () => {
		expect(MF.findMax(PATH_CROSSING_MIXED)).toEqual(1184)
	})
})

describe('map-parser#hasVector', () => {
	const vec = {start: {x: 1, y: 2}, end: {x: 4, y: 5}}

	it('has', () => {
		expect(MF.hasVector([{x: 1, y: 2}, {x: 8, y: 7}, {x: 4, y: 5}, {x: 14, y: -5}])(vec)).toBeTrue()
	})

	it('has not', () => {
		expect(MF.hasVector([{x: 10, y: 2}, {x: 80, y: 7}, {x: 40, y: 5}, {x: 14, y: -5}])(vec)).toBeFalse()
	})
})

describe('map-parser#uniqueVector', () => {
	const vec = {start: {x: 1, y: 2}, end: {x: 4, y: 5}}
	const vec1 = {start: {x: 11, y: 21}, end: {x: 4, y: 5}}

	it('remove one', () => {
		expect(MF.uniqueVector([vec, vec1, vec]).length).toEqual(2)
	})

	it('keep all', () => {
		expect(MF.uniqueVector([vec, vec1]).length).toEqual(2)
	})
})

describe('wad-model#vertexNear', () => {
	it('Equal', () => {
		const v1 = {x: 2, y: 3}
		const v2 = {x: 2, y: 3}
		expect(MF.vertexNear(v1, v2)).toBeTrue()
	})

	it('Not Equal', () => {
		const v1 = {x: 2, y: 3}
		const v2 = {x: 22, y: 3}
		expect(MF.vertexNear(v1, v2)).toBeFalse()
	})

	it('Near X', () => {
		const v1 = {x: 5, y: 3}
		const v2 = {x: 2, y: 3}
		expect(MF.vertexNear(v1, v2)).toBeTrue()
	})

	it('Near Y', () => {
		const v1 = {x: 2, y: 3}
		const v2 = {x: 2, y: 5}
		expect(MF.vertexNear(v1, v2)).toBeTrue()
	})

	it('Near X-Y', () => {
		const v1 = {x: 8, y: 3}
		const v2 = {x: 5, y: 5}
		expect(MF.vertexNear(v1, v2)).toBeTrue()
	})
})

describe('flat-builder#containsVertex', () => {
	const pa = MF.containsVertex(POLY_01_A)
	const pg = MF.containsVertex(POLY_01_G)

	it('POLY_01_A - outside - left 1', () => {
		expect(pa({"x": 1, "y": 1})).toBeFalse()
	})

	it('POLY_01_A - outside - left 2', () => {
		expect(pa({"x": 0, "y": 3})).toBeFalse()
	})

	it('POLY_01_A - inside - left on line', () => {
		expect(pa({"x": 2, "y": 1})).toBeTrue()
	})

	it('POLY_01_A - outside - down 1', () => {
		expect(pa({"x": 4, "y": -1})).toBeFalse()
	})

	it('POLY_01_A - outside - right from G', () => {
		expect(pa({"x": 11, "y": 2})).toBeFalse()
	})

	it('POLY_01_A - outside-  right on G 1', () => {
		expect(pa({"x": 8, "y": 2})).toBeFalse()
	})

	it('POLY_01_A - outside - right on G 2', () => {
		expect(pa({"x": 6, "y": 4})).toBeFalse()
	})

	it('POLY_01_A - right - on G 3', () => {
		expect(pa({"x": 6, "y": 2})).toBeTrue()
	})

	it('POLY_01_A - outside - top 1', () => {
		expect(pa({"x": 5, "y": 5})).toBeFalse()
	})

	it('POLY_01_G - outside - top 2', () => {
		expect(pg({"x": 5, "y": 7})).toBeFalse()
	})

	it('POLY_01_G - outside - top 2', () => {
		expect(pg({"x": 15, "y": 17})).toBeFalse()
	})

	it('POLY_01_G - outside - down 1', () => {
		expect(pg({"x": 6, "y": 0})).toBeFalse()
	})

	it('POLY_01_G - outside - down 1', () => {
		expect(pg({"x": 6, "y": -1111})).toBeFalse()
	})

	it('POLY_01_G - outside - far right down', () => {
		expect(pg({"x": 66666, "y": -1111})).toBeFalse()
	})

	it('POLY_01_G - inside 001', () => {
		expect(pg({"x": 8, "y": 2})).toBeTrue()
	})

	it('POLY_01_G - inside 002', () => {
		expect(pg({"x": 6, "y": 4})).toBeTrue()
	})

	it('POLY_01_G - inside 003', () => {
		expect(pg({"x": 9, "y": 4})).toBeTrue()
	})

	it('POLY_01_G - inside - on line left', () => {
		expect(pg({"x": 7, "y": 2})).toBeTrue()
	})

	it('POLY_01_G - inside - on edge left', () => {
		expect(pg({"x": 6, "y": 1})).toBeTrue()
	})

	it('POLY_01_G - inside - on line left', () => {
		expect(pg({"x": 5, "y": 5})).toBeTrue()
	})

	it('E1M1_S39 - inside - Thing 114', () => {
		const poly = MF.pathToPoints(TF.buildPolygons(39, E1M1_S39).get()[0])
		expect(MF.containsVertex(poly)({"x": 1024, "y": -3264})).toBeTrue()
	})

	it('E1M1_S39 - inside - Thing 35', () => {
		const poly = MF.pathToPoints(TF.buildPolygons(39, E1M1_S39).get()[0])
		expect(MF.containsVertex(poly)({"x": 1312, "y": -3264})).toBeTrue()
	})

	it('E1M1_S72 - inside - Thing 44', () => {
		const poly = MF.pathToPoints(TF.buildPolygons(72, E1M1_S72).get()[0])
		expect(MF.containsVertex(poly)({"x": 2912, "y": -4176})).toBeTrue()
	})

	it('E1M1_S72 - inside - Thing 45', () => {
		const poly = MF.pathToPoints(TF.buildPolygons(72, E1M1_S72).get()[0])
		expect(MF.containsVertex(poly)({"x": 3104, "y": -4176})).toBeTrue()
	})

	it('E1M1_S72 - inside - Thing 125', () => {
		const poly = MF.pathToPoints(TF.buildPolygons(72, E1M1_S72).get()[0])
		expect(MF.containsVertex(poly)({"x": 2944, "y": -4256})).toBeTrue()
	})

	it('E1M1_S72 - inside - Thing 112', () => {
		const poly = MF.pathToPoints(TF.buildPolygons(72, E1M1_S72).get()[0])
		expect(MF.containsVertex(poly)({"x": 3072, "y": -4256})).toBeTrue()
	})

	it('E1M1_S72 - inside - Thing 48', () => {
		const poly = MF.pathToPoints(TF.buildPolygons(72, E1M1_S72).get()[0])
		expect(MF.containsVertex(poly)({"x": 2944, "y": -4320})).toBeTrue()
	})

	it('E1M1_S72 - outside', () => {
		const poly = MF.pathToPoints(TF.buildPolygons(72, E1M1_S72).get()[0])
		expect(MF.containsVertex(poly)({"x": 1, "y": 1})).toBeFalse()
	})

	it('E1M3_S7 - inside - Thing 296', () => {
		const poly = MF.pathToPoints(TF.buildPolygons(7, E1M3_S7).get()[0])
		expect(MF.containsVertex(poly)({"x": 192, "y": -1280})).toBeTrue()
	})

	it('E1M3_S7 - inside - Thing 35', () => {
		const poly = MF.pathToPoints(TF.buildPolygons(7, E1M3_S7).get()[0])
		expect(MF.containsVertex(poly)({"x": -464, "y": -1712})).toBeTrue()
	})

	it('E1M3_S7 - inside - Thing 40', () => {
		const poly = MF.pathToPoints(TF.buildPolygons(7, E1M3_S7).get()[0])
		expect(MF.containsVertex(poly)({"x": -192, "y": -1856})).toBeTrue()
	})

	it('E1M3_S7 - outside', () => {
		const poly = MF.pathToPoints(TF.buildPolygons(7, E1M3_S7).get()[0])
		expect(MF.containsVertex(poly)({"x": -2192, "y": -1856})).toBeFalse()
	})

	it('E1M3_S7 - inside - Thing 320', () => {
		const poly = MF.pathToPoints(TF.buildPolygons(7, E1M3_S7).get()[0])
		expect(MF.containsVertex(poly)({"x": 256, "y": -1472})).toBeTrue()
	})

	it('E1M5_S18 - outside - Thing 128', () => {
		const poly = MF.pathToPoints(TF.buildPolygons(18, E1M5_S18).get()[1])
		expect(MF.containsVertex(poly)({"x": -960, "y": 864})).toBeFalse()
	})

	it('E1M5_S18 - inside - Thing 128', () => {
		const poly = MF.pathToPoints(TF.buildPolygons(18, E1M5_S18).get()[2])
		expect(MF.containsVertex(poly)({"x": -960, "y": 864})).toBeTrue()
	})

	it('E1M5_S18 - inside - Thing 129', () => {
		const poly = MF.pathToPoints(TF.buildPolygons(18, E1M5_S18).get()[2])
		expect(MF.containsVertex(poly)({"x": -980, "y": 800})).toBeTrue()
	})
})
