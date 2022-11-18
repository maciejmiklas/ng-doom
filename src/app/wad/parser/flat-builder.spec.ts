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
import {functions as fb, testFunctions as tf} from './flat-builder'
import {functions as mf} from './wad-model'
import {
	getCCOById,
	path300Full, path300Full100Started,
	pathClosedMixed,
	pathClosedMixed2,
	pathClosedReversedMix,
	pathClosedReversedOne,
	pathClosedSorted,
	pathContinuousOpen,
	VectorId
} from "./testdata/data"


const expectClosedPath = (path: VectorId[]) => {
	expect(mf.pathContinuos(path)).toBeTrue()
}

describe('flat-builder#buildPaths', () => {

	it('Path closed reversed mix', () => {
		const sorted = fb.buildPaths(pathClosedReversedMix)
		expect(sorted.length).toEqual(1)
		expect(sorted[0].length).toEqual(8)
		expectClosedPath(sorted[0])
	})


	it('Path closed mixed', () => {
		const sorted = fb.buildPaths(pathClosedMixed)
		expect(sorted.length).toEqual(1)
		expect(sorted[0].length).toEqual(9)
		expectClosedPath(sorted[0])
	})

	it('Path closed mixed 2', () => {
		const sorted = fb.buildPaths(pathClosedMixed2)
		expect(sorted.length).toEqual(1)
		expect(sorted[0].length).toEqual(5)
		expectClosedPath(sorted[0])
	})

	it('Path closed with extra point', () => {
		const sorted = fb.buildPaths([...pathClosedMixed,
			{"id": 99, "start": {"x": 999, "y": 999}, "end": {"x": 777, "y": 777}}])
		expect(sorted.length).toEqual(2)
		expect(sorted[0].length).toEqual(1)
		expect(sorted[1].length).toEqual(9)
		expectClosedPath(sorted[1])
		expect(sorted[0][0].id).toEqual(99)
	})

	it('Path closed mixed and sorted', () => {
		const sorted = fb.buildPaths(pathClosedSorted)
		expect(sorted.length).toEqual(1)
		expect(sorted[0].length).toEqual(9)
		expectClosedPath(sorted[0])
	})

	it('Two Paths', () => {
		const sorted = fb.buildPaths([...pathClosedMixed, ...pathClosedMixed2])
		expect(sorted.length).toEqual(2)
		expect(sorted[0].length).toEqual(5)
		expect(sorted[1].length).toEqual(9)
		expectClosedPath(sorted[0])
		expectClosedPath(sorted[1])
	})

	it('Path closed vectors reversed', () => {
		const sorted = fb.buildPaths(pathClosedReversedOne)
		expect(sorted.length).toEqual(1)
		expect(sorted[0].length).toEqual(5)
		expectClosedPath(sorted[0])
	})
})

describe('flat-builder#insertIntoPath', () => {

	it('Insert on the start do not reverse', () => {
		const inserted = tf.insertIntoPath(pathContinuousOpen)({
			"id": 999,
			"start": {"x": 901, "y": 902},
			"end": {"x": 100, "y": 200}
		})
		expect(inserted.isRight()).toBeTrue()
		expect(inserted.get().length).toEqual(6)
		expect(inserted.get()[0].id).toEqual(999)
		expect(inserted.get()[0].start.x).toEqual(901)
		expect(inserted.get()[0].end.x).toEqual(100)
	})

	it('Insert on the start and reverse', () => {
		const inserted = tf.insertIntoPath(pathContinuousOpen)({
			"id": 999,
			"start": {"x": 100, "y": 200},
			"end": {"x": 901, "y": 902}
		})
		expect(inserted.isRight()).toBeTrue()
		expect(inserted.get().length).toEqual(6)
		expect(inserted.get()[0].id).toEqual(999)
		expect(inserted.get()[0].start.x).toEqual(901)
		expect(inserted.get()[0].end.x).toEqual(100)
	})

	it('Break path - existing element', () => {
		const inserted = tf.insertIntoPath(pathContinuousOpen)({
			"id": 999,
			"start": {"x": 120, "y": 220},
			"end": {"x": 130, "y": 230}
		})
		expect(inserted.isLeft()).toBeTrue()
	})

	it('Break path - start connecting to 203', () => {
		const inserted = tf.insertIntoPath(pathContinuousOpen)({
			"id": 203,
			"start": {"x": 120, "y": 220},
			"end": {"x": 930, "y": 930}
		})
		expect(inserted.isLeft()).toBeTrue()
	})

	it('Break path - end connecting to 203', () => {
		const inserted = tf.insertIntoPath(pathContinuousOpen)({
			"id": 999,
			"start": {"x": 920, "y": 920},
			"end": {"x": 130, "y": 230}
		})
		expect(inserted.isLeft()).toBeTrue()
	})

})

describe('flat-builder#prependToPath', () => {

	it('VectorConnection:NONE', () => {
		const res = tf.prependToPath(pathContinuousOpen)({
			"id": 999,
			"start": {"x": 920, "y": 920},
			"end": {"x": 333, "y": 222}
		})
		expect(res.isLeft()).toBeTrue()
	})

	it('VectorConnection:V1END_TO_V2START', () => {
		const res = tf.prependToPath(pathContinuousOpen)({
			"id": 999,
			"start": {"x": 920, "y": 920},
			"end": {"x": 100, "y": 200}
		})
		expect(res.isRight()).toBeTrue()
		expect(res.get()[0].id).toEqual(999);
		expect(res.get()[0].start.x).toEqual(920);
		expect(res.get().length).toEqual(pathContinuousOpen.length + 1);
	})


	it('VectorConnection:V1START_TO_V2START', () => {
		const res = tf.prependToPath(pathContinuousOpen)({
			"id": 999,
			"start": {"x": 100, "y": 200},
			"end": {"x": 333, "y": 444}
		})
		expect(res.isRight()).toBeTrue()
		expect(res.get()[0].id).toEqual(999);
		expect(res.get()[0].start.x).toEqual(333);
		expect(res.get().length).toEqual(pathContinuousOpen.length + 1);
	})

	it('VectorConnection:V1END_TO_V2END', () => {
		const res = tf.prependToPath(pathContinuousOpen)({
			"id": 999,
			"start": {"x": 920, "y": 920},
			"end": {"x": 110, "y": 210}
		})
		expect(res.isLeft()).toBeTrue()
	})

	it('VectorConnection:V1START_TO_V2END', () => {
		const res = tf.prependToPath(pathContinuousOpen)({
			"id": 999,
			"start": {"x": 110, "y": 210},
			"end": {"x": 333, "y": 444}
		})
		expect(res.isLeft()).toBeTrue()
	})

})

describe('flat-builder#appendToPath', () => {

	it('VectorConnection:NONE', () => {
		const res = tf.appendToPath(pathContinuousOpen)({
			"id": 999,
			"start": {"x": 920, "y": 920},
			"end": {"x": 333, "y": 222}
		})
		expect(res.isLeft()).toBeTrue()
	})

	it('VectorConnection:V1END_TO_V2START', () => {
		const res = tf.appendToPath(pathContinuousOpen)({
			"id": 999,
			"start": {"x": 150, "y": 250},
			"end": {"x": 111, "y": 222}
		})
		expect(res.isRight()).toBeTrue()
		const el = res.get()[pathContinuousOpen.length];
		expect(el.id).toEqual(999);
		expect(el.start.x).toEqual(150);
		expect(res.get().length).toEqual(pathContinuousOpen.length + 1);
	})


	it('VectorConnection:V1START_TO_V2START', () => {
		const res = tf.appendToPath(pathContinuousOpen)({
			"id": 999,
			"start": {"x": 140, "y": 240},
			"end": {"x": 333, "y": 444}
		})
		expect(res.isLeft()).toBeTrue()
	})

	it('VectorConnection:V1END_TO_V2END', () => {
		const res = tf.appendToPath(pathContinuousOpen)({
			"id": 999,
			"start": {"x": 920, "y": 920},
			"end": {"x": 150, "y": 250}
		})
		expect(res.isRight()).toBeTrue()
		const el = res.get()[pathContinuousOpen.length];
		expect(el.id).toEqual(999);
		expect(el.start.x).toEqual(150);
		expect(res.get().length).toEqual(pathContinuousOpen.length + 1);
	})

	it('VectorConnection:V1START_TO_V2END', () => {
		const res = tf.appendToPath(pathContinuousOpen)({
			"id": 999,
			"start": {"x": 111, "y": 222},
			"end": {"x": 140, "y": 240}
		})
		expect(res.isLeft()).toBeTrue()
	})
})

describe('flat-builder#expandPath', () => {

	it('Never start new path', () => {
		expect(tf.expandPath(path300Full, getCCOById(102)).isLeft()).toBeTrue()
		expect(tf.expandPath(path300Full, getCCOById(202)).isLeft()).toBeTrue()
		expect(tf.expandPath(path300Full100Started, getCCOById(202)).isLeft()).toBeTrue()
	})

	it('Do not break closed path', () => {
		expect(tf.expandPath(path300Full, getCCOById(301)).isLeft()).toBeTrue()
		expect(tf.expandPath(path300Full, getCCOById(302)).isLeft()).toBeTrue()
	})

	it('Ignore already existing', () => {
		expect(tf.expandPath(path300Full100Started, getCCOById(102)).isLeft()).toBeTrue()
	})

	it('Expand 102', () => {
		let path = tf.expandPath(path300Full100Started, getCCOById(103)).get()
		expect(path[0].length).toEqual(2)
		expect(path[0][0].id).toEqual(102)
		expect(path[0][1].id).toEqual(103)

		path = tf.expandPath(path, getCCOById(101)).get()
		expect(path[0].length).toEqual(3)
		expect(path[0][0].id).toEqual(101)
		expect(path[0][1].id).toEqual(102)
		expect(path[0][2].id).toEqual(103)
	})

})
