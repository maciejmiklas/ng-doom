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
import {functions as MF, testFunctions as TF, VectorConnection, VectorV} from './wad-model'
import {
	E1M1_S37,
	E1M1_S39,
	E1M3_S66,
	E1M3_S7,
	E1M4_S36,
	PATH_CLOSED_1,
	PATH_CLOSED_MIXED,
	PATH_CLOSED_MIXED_2,
	PATH_CLOSED_REVERSED_MIX,
	PATH_CLOSED_REVERSED_ONE,
	PATH_CLOSED_SORTED,
	PATH_CONTINUOUS_OPEN,
	PATH_CROSSING_MIXED,
	VectorId
} from "./testdata/data"

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

describe('wad-model#isCrossingVector', () => {

	it('no flag', () => {
		const vv = {
			"id": 988,
			"start": {"x": -1552, "y": -2640},
			"end": {"x": -1408, "y": -2944},
		}
		expect(MF.isCrossingVector(vv)).toBeFalse()
	})

	it('flag true', () => {
		const vv = {
			"id": 988,
			"start": {"x": -1552, "y": -2640},
			"end": {"x": -1408, "y": -2944},
		}
		TF.setCrossing(vv)
		expect(MF.isCrossingVector(vv)).toBeTrue()
	})
})

describe('wad-model#firstNotCrossing', () => {

	it('none', () => {
		MF.cleanCrossingVectors(E1M3_S66)
		MF.groupCrossingVectors(E1M3_S66)
		const found = MF.firstNotCrossing(E1M3_S66)
		expect(found.isLeft()).toBeTrue()
	})

	it('all crossing', () => {
		MF.groupCrossingVectors(E1M3_S66)
		const found = MF.firstNotCrossing(E1M3_S66)
		expect(found.isLeft()).toBeTrue()
	})

	it('found', () => {
		MF.groupCrossingVectors(E1M4_S36)
		const found = MF.firstNotCrossing(E1M4_S36)
		expect(found.isRight()).toBeTrue()
	})
})

describe('wad-model#firstDuplicate', () => {

	it('found 1', () => {
		const found = MF.firstDuplicate(E1M4_S36)
		expect(found.isRight()).toBeTrue()
		expect(found.get()).toEqual(4)
	})

	it('found 2', () => {
		const found = MF.firstDuplicate(E1M3_S66)
		expect(found.isRight()).toBeTrue()
		expect(found.get()).toEqual(4)
	})

	it('not found 1', () => {
		expect(MF.firstDuplicate(PATH_CLOSED_1).isLeft()).toBeTrue()
	})

	it('not found 2', () => {
		expect(MF.firstDuplicate(PATH_CONTINUOUS_OPEN).isLeft()).toBeTrue()
	})

	it('not found 3', () => {
		expect(MF.firstDuplicate(PATH_CLOSED_MIXED).isLeft()).toBeTrue()
	})

	it('not found 4', () => {
		expect(MF.firstDuplicate(PATH_CLOSED_SORTED).isLeft()).toBeTrue()
	})

	it('not found 5', () => {
		expect(MF.firstDuplicate(PATH_CLOSED_MIXED_2).isLeft()).toBeTrue()
	})

	it('not found 6', () => {
		expect(MF.firstDuplicate(PATH_CLOSED_REVERSED_ONE).isLeft()).toBeTrue()
	})

	it('not found 7', () => {
		expect(MF.firstDuplicate(PATH_CLOSED_REVERSED_MIX).isLeft()).toBeTrue()
	})

	it('not found 8', () => {
		expect(MF.firstDuplicate(E1M1_S37).isLeft()).toBeTrue()
	})

	it('not found 9', () => {
		expect(MF.firstDuplicate(PATH_CROSSING_MIXED).isLeft()).toBeTrue()
	})

	it('not found 10', () => {
		expect(MF.firstDuplicate(E1M1_S39).isLeft()).toBeTrue()
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

describe('wad-model#firstVectorByVertex', () => {

	it('found', () => {
		expect(MF.firstVectorByVertex(PATH_CROSSING_MIXED)({"x": 1184, "y": -3360}).get()).toEqual(5)
	})

	it('not found', () => {
		expect(MF.firstVectorByVertex(PATH_CROSSING_MIXED)({"x": 928, "y": 3360}).isLeft()).toBeTruthy()
	})
})

describe('wad-model#groupByVertex', () => {

	it('Found', () => {
		const v = {"x": 928, "y": -3104}
		const either = MF.groupByVertex(PATH_CROSSING_MIXED)(v)
		expect(either.isRight()).toBeTrue()
		const res = either.get()
		expect(res.length).toEqual(2)

		expect(res[0].length).toEqual(4)
		expect(res[1].length).toEqual(PATH_CROSSING_MIXED.length - 4)
		const has = MF.hasVertex(v)
		res[0].forEach(vv => expect(has(vv)).toBeTrue())
		res[1].forEach(vv => expect(has(vv)).toBeFalse())
	})

	it('Not found', () => {
		const either = MF.groupByVertex(PATH_CROSSING_MIXED)({"x": 928, "y": 3360})
		expect(either.isRight()).toBeFalse()
	})

})


describe('wad-model#markCrossingVectors', () => {

	it('Some are crossing', () => {
		MF.cleanCrossingVectors(E1M4_S36)
		expect(E1M4_S36.filter(MF.isCrossingVector).length).toEqual(0)

		MF.markCrossingVectors(E1M4_S36)
		expect(E1M4_S36.filter(MF.isCrossingVector).length).toEqual(6)

		MF.cleanCrossingVectors(E1M4_S36)
		expect(E1M4_S36.filter(MF.isCrossingVector).length).toEqual(0)
	})

	it('No crossings', () => {
		MF.cleanCrossingVectors(E1M3_S7)
		expect(E1M3_S7.filter(MF.isCrossingVector).length).toEqual(0)

		MF.markCrossingVectors(E1M3_S7)
		expect(E1M3_S7.filter(MF.isCrossingVector).length).toEqual(0)
	})

	it('all are crossing', () => {
		MF.cleanCrossingVectors(E1M3_S66)
		expect(E1M3_S66.filter(MF.isCrossingVector).length).toEqual(0)

		MF.markCrossingVectors(E1M3_S66)
		expect(E1M3_S66.filter(MF.isCrossingVector).length).toEqual(6)

		MF.cleanCrossingVectors(E1M3_S66)
		expect(E1M3_S66.filter(MF.isCrossingVector).length).toEqual(0)
	})
})

describe('wad-model#groupCrossingVectors', () => {

	it('No crossings 1', () => {
		expect(MF.groupCrossingVectors(E1M1_S39).isLeft()).toBeTrue()
	})

	it('No crossings 2', () => {
		expect(MF.groupCrossingVectors(E1M3_S7).isLeft()).toBeTrue()
	})

	it('All are crossing', () => {
		execCrossingTest(E1M3_S66)
	})

	it('Some are crossing 1', () => {
		execCrossingTest(E1M4_S36)
	})

	it('Some are crossing 2', () => {
		execCrossingTest(E1M1_S37)
	})

})

const execCrossingTest = (data: VectorId[]) => {
	MF.cleanCrossingVectors(data)
	const crossing = MF.groupCrossingVectors(data).get();

	// all crossings are has been flagged
	crossing.crossing.forEach(v => expect(MF.isCrossingVector(v)).toBeTrue());

	// remaining are not crossing
	crossing.remaining.forEach(v => expect(MF.isCrossingVector(v)).toBeFalse());

	expect(crossing.crossing.length + crossing.remaining.length).toEqual(data.length)
	MF.cleanCrossingVectors(data)
}

describe('wad-model#pathClosed', () => {

	it('closed', () => {
		expect(MF.pathClosed(PATH_CLOSED_SORTED)).toBeTrue()
		expect(MF.pathOpen(PATH_CLOSED_SORTED)).toBeFalse()
	})

	it('not closed', () => {
		expect(MF.pathClosed(PATH_CLOSED_MIXED)).toBeFalse()
		expect(MF.pathOpen(PATH_CLOSED_MIXED)).toBeTrue()
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

describe('wad-model#pathContinuos', () => {

	it('Closed', () => {
		expect(MF.pathContinuos(PATH_CLOSED_SORTED)).toBeTrue()
	})

	it('Mixed', () => {
		expect(MF.pathContinuos(PATH_CLOSED_MIXED)).toBeFalse()
	})

	it('Mixed 2', () => {
		expect(MF.pathContinuos(PATH_CLOSED_MIXED_2)).toBeFalse()
	})

	it('Reversed one', () => {
		expect(MF.pathContinuos(PATH_CLOSED_REVERSED_ONE)).toBeFalse()
	})

	it('Reversed mix', () => {
		expect(MF.pathContinuos(PATH_CLOSED_REVERSED_MIX)).toBeFalse()
	})

	it('Continuous open', () => {
		expect(MF.pathContinuos(PATH_CONTINUOUS_OPEN)).toBeFalse()
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

describe('wad-model#closePath', () => {
	it('Continuous Open', () => {
		const path = MF.closePath(PATH_CONTINUOUS_OPEN)
		const pol = PATH_CONTINUOUS_OPEN.length
		expect(path.length).toEqual(pol + 1)
		const newVector = path[pol]
		expect(PATH_CONTINUOUS_OPEN[pol - 1].id).toEqual(path[path.length - 2].id)
		expect(MF.vertexEqual(newVector.start, PATH_CONTINUOUS_OPEN[pol - 1].end)).toBeTrue()
		expect(MF.vertexEqual(newVector.end, PATH_CONTINUOUS_OPEN[0].start)).toBeTrue()
	})
})




