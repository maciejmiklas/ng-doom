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
import {functions as mf, VectorConnection, VectorV} from './wad-model'
import {
	pathClosedMixed,
	pathClosedMixed2,
	pathClosedReversedMix,
	pathClosedReversedOne,
	pathClosedSorted,
	pathContinuousOpen,
	pathCrossingMixedReversed
} from "./testdata/data"

describe('wad-model#vertexEqual', () => {
	it('Equal', () => {
		const v1 = {x: 2, y: 3}
		const v2 = {x: 2, y: 3}
		expect(mf.vertexEqual(v1, v2)).toBeTrue()
	})

	it('Not Equal', () => {
		const v1 = {x: 2, y: 3}
		const v2 = {x: 22, y: 3}
		expect(mf.vertexEqual(v1, v2)).toBeFalse()
	})
})

describe('wad-model#reverseVector', () => {

	it('reverse', () => {
		const val = {"start": {"x": 700, "y": 800}, "end": {"x": 500, "y": 600}}
		const reversed = mf.reverseVector(val)

		expect(val.start.x).toEqual(700)
		expect(reversed.start.x).toEqual(500)

		expect(val.end.x).toEqual(500)
		expect(reversed.end.x).toEqual(700)
	})

})

describe('wad-model#pathToPoints', () => {

	it('Continuous path', () => {
		const points = mf.pathToPoints(pathClosedMixed2)
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
		expect(mf.hasVertex({x: 2, y: 4})(vector)).toBeTrue()
	})

	it('has no vertex', () => {
		expect(mf.hasVertex({x: 4, y: 4})(vector)).toBeFalse()
	})
})


describe('wad-model#vectorsConnected', () => {
	it('Connected - the same', () => {
		const v1 = {start: {x: 1, y: 2}, end: {x: 4, y: 5}}
		const v2 = {start: {x: 1, y: 2}, end: {x: 4, y: 5}}
		expect(mf.vectorsConnected(v1, v2)).toEqual(VectorConnection.V1START_TO_V2START)
	})

	it('Connected - start to start', () => {
		const v1 = {start: {x: 1, y: 2}, end: {x: 4, y: 5}}
		const v2 = {start: {x: 1, y: 2}, end: {x: 43, y: 54}}
		expect(mf.vectorsConnected(v1, v2)).toEqual(VectorConnection.V1START_TO_V2START)
	})

	it('Connected - start to end', () => {
		const v1 = {start: {x: 1, y: 2}, end: {x: 34, y: 45}}
		const v2 = {start: {x: 1, y: 2}, end: {x: 1, y: 2}}
		expect(mf.vectorsConnected(v1, v2)).toEqual(VectorConnection.V1START_TO_V2END)
	})

	it('Connected - end to end', () => {
		const v1 = {start: {x: 41, y: 42}, end: {x: 4, y: 5}}
		const v2 = {start: {x: 1, y: 2}, end: {x: 4, y: 5}}
		expect(mf.vectorsConnected(v1, v2)).toEqual(VectorConnection.V1END_TO_V2END)
	})

	it('Connected - end to start', () => {
		const v1 = {start: {x: 21, y: 12}, end: {x: 4, y: 5}}
		const v2 = {start: {x: 4, y: 5}, end: {x: 4, y: 5}}
		expect(mf.vectorsConnected(v1, v2)).toEqual(VectorConnection.V1END_TO_V2START)
	})

	it('Connected - end to end 2', () => {
		const v1 = {start: {x: 13, y: 24}, end: {x: 4, y: 5}}
		const v2 = {start: {x: 1, y: 2}, end: {x: 4, y: 5}}
		expect(mf.vectorsConnected(v1, v2)).toEqual(VectorConnection.V1END_TO_V2END)
	})

	it('Not connected', () => {
		const v1 = {start: {x: 1, y: 2}, end: {x: 4, y: 5}}
		const v2 = {start: {x: 11, y: 12}, end: {x: 14, y: 15}}
		expect(mf.vectorsConnected(v1, v2)).toEqual(VectorConnection.NONE)
	})
})

describe('wad-model#vectorReversed', () => {

	it('In path', () => {
		expect(mf.vectorReversed(pathClosedReversedOne)(
			{"start": {"x": 700, "y": 800}, "end": {"x": 10, "y": 20}})).toBeFalse()
	})

	it('Not in path', () => {
		expect(mf.vectorReversed(pathClosedReversedOne)(
			{"start": {"x": 700, "y": 800}, "end": {"x": 500, "y": 600}})).toBeTrue()
	})

})

describe('wad-model#countVertex', () => {

	it('found 4', () => {
		expect(mf.countVertex(pathCrossingMixedReversed)({"x": 928, "y": -3360})).toEqual(4)
	})

	it('found 0', () => {
		expect(mf.countVertex(pathCrossingMixedReversed)({"x": 928, "y": 3360})).toEqual(0)
	})

})

describe('wad-model#uniqueVertex', () => {

	it('count', () => {
		expect(mf.uniqueVertex(pathClosedMixed2).length).toEqual(pathClosedMixed2.length)
	})

	it('no duplicates', () => {
		const unique = mf.uniqueVertex(pathClosedMixed2)
		unique.forEach(v => {
			let cnt = 0
			unique.forEach(vv => {
				if (mf.vertexEqual(v, vv)) {
					cnt++
				}
			})
			expect(cnt).withContext(JSON.stringify(v)).toEqual(1)
		})
	})
})

describe('wad-model#findFirstVectorByVertex', () => {

	it('found', () => {
		expect(mf.findFirstVectorByVertex(pathCrossingMixedReversed)({"x": 928, "y": -3072}).get()).toEqual(8)
	})

	it('not found', () => {
		expect(mf.findFirstVectorByVertex(pathCrossingMixedReversed)({"x": 928, "y": 3360}).isLeft).toBeTruthy()
	})
})

describe('wad-model#groupByVertex', () => {

	it('Found', () => {
		const v = {"x": 928, "y": -3360}
		const either = mf.groupByVertex(pathCrossingMixedReversed)(v)
		expect(either.isRight()).toBeTrue()
		const res = either.get()
		expect(res.length).toEqual(2)

		expect(res[0].length).toEqual(4)
		expect(res[1].length).toEqual(pathCrossingMixedReversed.length - 4)
		const has = mf.hasVertex(v)
		res[0].forEach(vv => expect(has(vv)).toBeTrue())
		res[1].forEach(vv => expect(has(vv)).toBeFalse())
	})

	it('Not found', () => {
		const either = mf.groupByVertex(pathCrossingMixedReversed)({"x": 928, "y": 3360})
		expect(either.isRight()).toBeFalse()
	})

})

describe('wad-model#groupCrossingVectors', () => {

	it('found', () => {
		const crossing = mf.groupCrossingVectors(pathCrossingMixedReversed).get();
		expect(crossing.crossing.length).toEqual(2);
		expect(crossing.crossing[0].length).toEqual(4);
		expect(crossing.crossing[1].length).toEqual(3);
		expect(crossing.remaining.length).toEqual(pathCrossingMixedReversed.length - (crossing.crossing[0].length + crossing.crossing[1].length));

		crossing.crossing[0].forEach(v => expect(v.msg).toEqual('Crossing B 928,-3360'))
		crossing.crossing[1].forEach(v => expect(v.msg).toEqual('Crossing A 928,-3104'))
		crossing.remaining.forEach(v => expect(v.msg).toBeUndefined())
	})

	it('Not found', () => {
		expect(mf.groupCrossingVectors(pathClosedReversedMix).isLeft()).toBeTrue()
	})

	it('Crossing flag', () => {
		const crossing = mf.groupCrossingVectors(pathCrossingMixedReversed).get();
		crossing.remaining.forEach(v => expect(mf.isCrossing(v)).toBeFalse());
		crossing.crossing.forEach(vv => vv.forEach(v => expect(mf.isCrossing(v)).toBeTrue()));

	})

})

describe('wad-model#pathClosed', () => {

	it('closed', () => {
		expect(mf.pathClosed(pathClosedSorted)).toBeTrue()
	})

	it('not closed', () => {
		expect(mf.pathClosed(pathClosedMixed)).toBeFalse()
	})
})

describe('wad-model#pathContinuos', () => {

	it('Closed', () => {
		expect(mf.pathContinuos(pathClosedSorted)).toBeTrue()
	})

	it('Mixed', () => {
		expect(mf.pathContinuos(pathClosedMixed)).toBeFalse()
	})

	it('Mixed 2', () => {
		expect(mf.pathContinuos(pathClosedMixed2)).toBeFalse()
	})

	it('Reversed one', () => {
		expect(mf.pathContinuos(pathClosedReversedOne)).toBeFalse()
	})

	it('Reversed mix', () => {
		expect(mf.pathContinuos(pathClosedReversedMix)).toBeFalse()
	})

	it('Continuous open', () => {
		expect(mf.pathContinuos(pathContinuousOpen)).toBeFalse()
	})
})




