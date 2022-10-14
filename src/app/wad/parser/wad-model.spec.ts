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
	pathClosedMixed2,
	pathClosedReversedMix,
	pathClosedReversedOne,
	pathRectanglesMixedReversed
} from "./testdata/data"

describe('wad_model#vertexEqual', () => {
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

describe('wad_model#reverseVector', () => {

	it('reverse', () => {
		const val = {"start": {"x": 700, "y": 800}, "end": {"x": 500, "y": 600}}
		const reversed = mf.reverseVector(val)

		expect(val.start.x).toEqual(700)
		expect(reversed.start.x).toEqual(500)

		expect(val.end.x).toEqual(500)
		expect(reversed.end.x).toEqual(700)
	})

})

describe('wad_model#pathToPoints', () => {

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

describe('wad_model#hasVertex', () => {
	const vector: VectorV = {start: {x: 2, y: 4}, end: {x: 2, y: 4}}

	it('has vertex', () => {
		expect(mf.hasVertex({x: 2, y: 4})(vector)).toBeTrue()
	})

	it('has no vertex', () => {
		expect(mf.hasVertex({x: 4, y: 4})(vector)).toBeFalse()
	})
})


describe('map-parser#vectorsConnected', () => {
	it('Connected - the same', () => {
		const v1 = {start: {x: 1, y: 2}, end: {x: 4, y: 5}}
		const v2 = {start: {x: 1, y: 2}, end: {x: 4, y: 5}}
		expect(mf.vectorsConnected(v1, v2)).toEqual(VectorConnection.REVERSED)
	})

	it('Connected - start to start', () => {
		const v1 = {start: {x: 1, y: 2}, end: {x: 4, y: 5}}
		const v2 = {start: {x: 1, y: 2}, end: {x: 43, y: 54}}
		expect(mf.vectorsConnected(v1, v2)).toEqual(VectorConnection.REVERSED)
	})

	it('Connected - start to end', () => {
		const v1 = {start: {x: 1, y: 2}, end: {x: 34, y: 45}}
		const v2 = {start: {x: 1, y: 2}, end: {x: 1, y: 2}}
		expect(mf.vectorsConnected(v1, v2)).toEqual(VectorConnection.V2END_TO_V1START)
	})

	it('Connected - end to end', () => {
		const v1 = {start: {x: 41, y: 42}, end: {x: 4, y: 5}}
		const v2 = {start: {x: 1, y: 2}, end: {x: 4, y: 5}}
		expect(mf.vectorsConnected(v1, v2)).toEqual(VectorConnection.REVERSED)
	})

	it('Connected - end to start', () => {
		const v1 = {start: {x: 21, y: 12}, end: {x: 4, y: 5}}
		const v2 = {start: {x: 4, y: 5}, end: {x: 4, y: 5}}
		expect(mf.vectorsConnected(v1, v2)).toEqual(VectorConnection.V1END_TO_V2START)
	})

	it('Connected - end to end 2', () => {
		const v1 = {start: {x: 13, y: 24}, end: {x: 4, y: 5}}
		const v2 = {start: {x: 1, y: 2}, end: {x: 4, y: 5}}
		expect(mf.vectorsConnected(v1, v2)).toEqual(VectorConnection.REVERSED)
	})

	it('Not connected', () => {
		const v1 = {start: {x: 1, y: 2}, end: {x: 4, y: 5}}
		const v2 = {start: {x: 11, y: 12}, end: {x: 14, y: 15}}
		expect(mf.vectorsConnected(v1, v2)).toEqual(VectorConnection.NONE)
	})
})

describe('map-parser#vectorReversed', () => {

	it('In path', () => {
		expect(mf.vectorReversed(pathClosedReversedOne)(
			{"start": {"x": 700, "y": 800}, "end": {"x": 10, "y": 20}})).toBeFalse()
	})

	it('Not in path', () => {
		expect(mf.vectorReversed(pathClosedReversedOne)(
			{"start": {"x": 700, "y": 800}, "end": {"x": 500, "y": 600}})).toBeTrue()
	})

})

describe('map-parser#countVertex', () => {

	it('found 4', () => {
		expect(mf.countVertex(pathRectanglesMixedReversed)({"x": 928, "y": -3360})).toEqual(4)
	})

	it('found 0', () => {
		expect(mf.countVertex(pathRectanglesMixedReversed)({"x": 928, "y": 3360})).toEqual(0)
	})

})

describe('map-parser#uniqueVertex', () => {

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

describe('map-parser#findFirstVectorByVertex', () => {

	it('found', () => {
		expect(mf.findFirstVectorByVertex(pathRectanglesMixedReversed)({"x": 928, "y": -3072}).get()).toEqual(8)
	})

	it('not found', () => {
		expect(mf.findFirstVectorByVertex(pathRectanglesMixedReversed)({"x": 928, "y": 3360}).isLeft).toBeTruthy()
	})
})

describe('map-parser#groupByVertex', () => {

	it('Found', () => {
		const v = {"x": 928, "y": -3360}
		const either = mf.groupByVertex(pathRectanglesMixedReversed)(v)
		expect(either.isRight()).toBeTrue()
		const res = either.get()
		expect(res.length).toEqual(2)

		expect(res[0].length).toEqual(4)
		expect(res[1].length).toEqual(pathRectanglesMixedReversed.length - 4)
		const has = mf.hasVertex(v)
		res[0].forEach(vv => expect(has(vv)).toBeTrue())
		res[1].forEach(vv => expect(has(vv)).toBeFalse())
	})

	it('Not found', () => {
		const either = mf.groupByVertex(pathRectanglesMixedReversed)({"x": 928, "y": 3360})
		expect(either.isRight()).toBeFalse()
	})

})

describe('map-parser#groupCrossingVectors', () => {

	it('found', () => {
		const crossing = mf.groupCrossingVectors(pathRectanglesMixedReversed).get();
		expect(crossing.crossing.length).toEqual(2);
		expect(crossing.crossing[0].length).toEqual(4);
		expect(crossing.crossing[1].length).toEqual(3);
		expect(crossing.remaining.length).toEqual(pathRectanglesMixedReversed.length - (crossing.crossing[0].length + crossing.crossing[1].length));

		crossing.crossing[0].forEach(v => expect(v.msg).toEqual('Crossing B 928,-3360'))
		crossing.crossing[1].forEach(v => expect(v.msg).toEqual('Crossing A 928,-3104'))
		crossing.remaining.forEach(v => expect(v.msg).toBeUndefined())
	})

	it('Not found', () => {
		expect(mf.groupCrossingVectors(pathClosedReversedMix).isLeft()).toBeTrue();
	})

})





