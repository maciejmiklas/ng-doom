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
	e1M3Sector7VectorsFromWad,
	getMaps,
	pathClosedMixed,
	pathClosedMixed2,
	pathClosedReversedMix,
	pathClosedReversedOne,
	pathClosedSorted,
	pathContinuousOpen,
	pathCrossingClosedOrdered,
	pathCrossingMixed,
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
		const points = MF.pathToPoints(pathClosedMixed2)
		expect(points.length).toEqual(5)

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
		expect(MF.vectorsConnected(v1, v2)).toEqual(VectorConnection.V1START_TO_V2START)
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
		const v2 = {start: {x: 1, y: 2}, end: {x: 4, y: 5}}
		expect(MF.vectorsConnected(v1, v2)).toEqual(VectorConnection.V1END_TO_V2END)
	})

	it('Connected - end to start', () => {
		const v1 = {start: {x: 21, y: 12}, end: {x: 4, y: 5}}
		const v2 = {start: {x: 4, y: 5}, end: {x: 4, y: 5}}
		expect(MF.vectorsConnected(v1, v2)).toEqual(VectorConnection.V1END_TO_V2START)
	})

	it('Connected - end to end 2', () => {
		const v1 = {start: {x: 13, y: 24}, end: {x: 4, y: 5}}
		const v2 = {start: {x: 1, y: 2}, end: {x: 4, y: 5}}
		expect(MF.vectorsConnected(v1, v2)).toEqual(VectorConnection.V1END_TO_V2END)
	})

	it('Not connected', () => {
		const v1 = {start: {x: 1, y: 2}, end: {x: 4, y: 5}}
		const v2 = {start: {x: 11, y: 12}, end: {x: 14, y: 15}}
		expect(MF.vectorsConnected(v1, v2)).toEqual(VectorConnection.NONE)
	})
})

describe('wad-model#vectorReversed', () => {

	it('In path', () => {
		expect(MF.vectorReversed(pathClosedReversedOne)(
			{"start": {"x": 700, "y": 800}, "end": {"x": 10, "y": 20}})).toBeFalse()
	})

	it('Not in path', () => {
		expect(MF.vectorReversed(pathClosedReversedOne)(
			{"start": {"x": 700, "y": 800}, "end": {"x": 500, "y": 600}})).toBeTrue()
	})

})

describe('wad-model#countVertex', () => {

	it('found 4', () => {
		expect(MF.countVertex(pathCrossingMixed)({"x": 928, "y": -3104})).toEqual(4)
	})

	it('found 0', () => {
		expect(MF.countVertex(pathCrossingMixed)({"x": 928, "y": 3360})).toEqual(0)
	})

})

describe('wad-model#uniqueVertex', () => {

	it('count', () => {
		expect(MF.uniqueVertex(pathClosedMixed2).length).toEqual(pathClosedMixed2.length)
	})

	it('no duplicates', () => {
		const unique = MF.uniqueVertex(pathClosedMixed2)
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

describe('wad-model#findFirstVectorByVertex', () => {

	it('found', () => {
		expect(MF.findFirstVectorByVertex(pathCrossingMixed)({"x": 1184, "y": -3360}).get()).toEqual(5)
	})

	it('not found', () => {
		expect(MF.findFirstVectorByVertex(pathCrossingMixed)({"x": 928, "y": 3360}).isLeft()).toBeTruthy()
	})
})

describe('wad-model#groupByVertex', () => {

	it('Found', () => {
		const v = {"x": 928, "y": -3104}
		const either = MF.groupByVertex(pathCrossingMixed)(v)
		expect(either.isRight()).toBeTrue()
		const res = either.get()
		expect(res.length).toEqual(2)

		expect(res[0].length).toEqual(4)
		expect(res[1].length).toEqual(pathCrossingMixed.length - 4)
		const has = MF.hasVertex(v)
		res[0].forEach(vv => expect(has(vv)).toBeTrue())
		res[1].forEach(vv => expect(has(vv)).toBeFalse())
	})

	it('Not found', () => {
		const either = MF.groupByVertex(pathCrossingMixed)({"x": 928, "y": 3360})
		expect(either.isRight()).toBeFalse()
	})

})

describe('wad-model#groupCrossingVectors', () => {

	it('Not found', () => {
		expect(MF.groupCrossingVectors(pathClosedReversedMix).isLeft()).toBeTrue()
	})

	it('Crossing flag', () => {
		const crossing = MF.groupCrossingVectors(pathCrossingClosedOrdered).get();
		crossing.remaining.forEach(v => expect(MF.isCrossingVector(v)).toBeFalse());
		crossing.crossing.forEach(vv => vv.forEach(v => expect(MF.isCrossingVector(v)).toBeTrue()));
	})

	it('closed crossing path and ordered', () => {
		execCrossingTest(pathCrossingClosedOrdered)
	})

	it('closed crossing path and mixed', () => {
		execCrossingTest(pathCrossingMixed)
	})

	it('Crossing mixed', () => {
		const crossing = MF.groupCrossingVectors(pathCrossingMixed).get();
		crossing.remaining.forEach(v => {
			expect(MF.isCrossingVector(v)).toBeFalse()
			expect(v.msg).toBeUndefined()
		});
		crossing.crossing.forEach(vv => vv.forEach(v => {
			expect(MF.isCrossingVector(v)).toBeTrue()
			expect(v.msg.startsWith('Crossing')).toBeTrue()
		}));
	})

})

const execCrossingTest = (data: VectorId[]) => {
	const crossing = MF.groupCrossingVectors(data).get();
	const cr0 = crossing.crossing[0];
	expect(cr0.length).toEqual(4)
	cr0.forEach(cr => {
		expect(cr.msg.startsWith('Crossing A')).toBeTrue()
		expect(MF.isCrossingVector(cr)).toBeTrue()
	})

	const cr1 = crossing.crossing[1];
	expect(cr1.length).toEqual(3)
	cr1.forEach(cr => {
		expect(cr.msg.startsWith('Crossing B')).toBeTrue()
		expect(MF.isCrossingVector(cr)).toBeTrue()
	})

	crossing.remaining.forEach(v => expect(MF.isCrossingVector(v)).toBeFalse());
	crossing.remaining.forEach(v => expect(v.msg).toBeUndefined());
}

describe('wad-model#pathClosed', () => {

	it('closed', () => {
		expect(MF.pathClosed(pathClosedSorted)).toBeTrue()
	})

	it('not closed', () => {
		expect(MF.pathClosed(pathClosedMixed)).toBeFalse()
	})
})

describe('wad-model#pathContinuos', () => {

	it('Closed', () => {
		expect(MF.pathContinuos(pathClosedSorted)).toBeTrue()
	})

	it('Mixed', () => {
		expect(MF.pathContinuos(pathClosedMixed)).toBeFalse()
	})

	it('Mixed 2', () => {
		expect(MF.pathContinuos(pathClosedMixed2)).toBeFalse()
	})

	it('Reversed one', () => {
		expect(MF.pathContinuos(pathClosedReversedOne)).toBeFalse()
	})

	it('Reversed mix', () => {
		expect(MF.pathContinuos(pathClosedReversedMix)).toBeFalse()
	})

	it('Continuous open', () => {
		expect(MF.pathContinuos(pathContinuousOpen)).toBeFalse()
	})
})

describe('map-parser#findMinX', () => {
	it('positive', () => {
		expect(MF.findMinX(pathCrossingMixed)).toEqual(896)
	})

	it('negative', () => {
		expect(MF.findMinX(e1M3Sector7VectorsFromWad)).toEqual(-640)
	})
})

describe('map-parser#findMaxX', () => {
	it('positive 1', () => {
		expect(MF.findMaxX(pathCrossingMixed)).toEqual(1184)
	})

	it('positive 2', () => {
		expect(MF.findMaxX(e1M3Sector7VectorsFromWad)).toEqual(288)
	})
})

describe('map-parser#findMinY', () => {
	it('negative', () => {
		expect(MF.findMinY(pathCrossingMixed)).toEqual(-3392)
	})

	it('positive', () => {
		expect(MF.findMinY(pathClosedReversedOne)).toEqual(20)
	})
})

describe('map-parser#findMaxY', () => {
	it('negative', () => {
		expect(MF.findMaxY(pathCrossingMixed)).toEqual(-3072)
	})

	it('positive', () => {
		expect(MF.findMaxY(pathClosedReversedOne)).toEqual(800)
	})
})

describe('map-parser#findMax', () => {
	it('positive', () => {
		expect(MF.findMax(pathCrossingMixed)).toEqual(1184)
	})
})




