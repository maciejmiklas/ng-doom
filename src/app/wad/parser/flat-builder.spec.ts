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
import {testFunctions as TF} from './flat-builder'
import {functions as MF} from './wad-model'
import {
	e1M3Sector7VectorsFromWad,
	getCCOById,
	pathClosedMixed,
	pathClosedMixed2,
	pathClosedReversedMix,
	pathClosedReversedOne,
	pathClosedSorted,
	pathContinuousOpen,
	pathCrossing300Full,
	pathCrossing300Full100Started,
	pathCrossingClosedOrdered,
	pathCrossingMixed,
	pathCrossingsMissing200,
	pathCrossingsPartial,
	pathSector39,
	VectorId
} from "./testdata/data"


const expectClosedPath = (path: VectorId[]) => {
	expect(MF.pathContinuos(path)).toBeTrue()
}

describe('flat-builder#buildPaths', () => {

	it('E1M2 - sector 7', () => {
		const paths = TF.buildPaths(7, e1M3Sector7VectorsFromWad).get()
		expect(paths.length).toEqual(4)

		// the main path on sector 7 is open due to vertex misplacement by 8 points - vectors do not connect
		expect(MF.pathClosed(paths[0])).toBeFalse()
		expect(MF.pathContinuos(paths[0])).toBeFalse()

		for (let i = 1; i < paths.length; i++) {
			expect(MF.pathClosed(paths[i])).toBeTrue()
			expect(MF.pathContinuos(paths[i])).toBeTrue()
		}
	})

	it('Path crossing mixed', () => {
		const paths = TF.buildPaths(11, pathCrossingMixed).get()
		expect(paths.length).toEqual(3)
		paths.forEach(p => {
			expect(p.length).toEqual(4)
			expectClosedPath(p)
		})
	})

	it('Path crossing ordered', () => {
		const paths = TF.buildPaths(11, pathCrossingClosedOrdered).get()
		expect(paths.length).toEqual(3)
		paths.forEach(p => {
			expect(p.length).toEqual(4)
			expectClosedPath(p)
		})
	})

	it('Path closed reversed mix', () => {
		const path = TF.buildPaths(11, pathClosedReversedMix).get()
		expect(path.length).toEqual(1)
		expect(path[0].length).toEqual(8)
		expectClosedPath(path[0])
	})

	it('Path closed mixed', () => {
		const path = TF.buildPaths(11, pathClosedMixed).get()
		expect(path.length).toEqual(1)
		expect(path[0].length).toEqual(9)
		expectClosedPath(path[0])
	})

	it('Path closed mixed 2', () => {
		const path = TF.buildPaths(11, pathClosedMixed2).get()
		expect(path.length).toEqual(1)
		expect(path[0].length).toEqual(5)
		expectClosedPath(path[0])
	})

	it('Path closed with extra point', () => {
		const paths = TF.buildPaths(11, [...pathClosedMixed,
			{"id": 99, "start": {"x": 999, "y": 999}, "end": {"x": 777, "y": 777}}]).get()
		expect(paths.length).toEqual(1)
		expect(paths[0].length).toEqual(9)
		expectClosedPath(paths[0])
	})

	it('Path closed mixed and sorted', () => {
		const paths = TF.buildPaths(11, pathClosedSorted).get()
		expect(paths.length).toEqual(1)
		expect(paths[0].length).toEqual(9)
		expectClosedPath(paths[0])
	})

	it('Two Paths', () => {
		const paths = TF.buildPaths(11, [...pathClosedMixed, ...pathClosedMixed2]).get()
		expect(paths.length).toEqual(2)
		expect(paths[0].length).toEqual(9)
		expect(paths[1].length).toEqual(5)
		expectClosedPath(paths[0])
		expectClosedPath(paths[1])
	})

	it('Path closed vectors reversed', () => {
		const paths = TF.buildPaths(11, pathClosedReversedOne).get()
		expect(paths.length).toEqual(1)
		expect(paths[0].length).toEqual(5)
		expectClosedPath(paths[0])
	})
})

describe('flat-builder#insertIntoPath', () => {

	it('Insert on the start do not reverse', () => {
		const inserted = TF.insertIntoPath(pathContinuousOpen)({
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
		const inserted = TF.insertIntoPath(pathContinuousOpen)({
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
		const inserted = TF.insertIntoPath(pathContinuousOpen)({
			"id": 999,
			"start": {"x": 120, "y": 220},
			"end": {"x": 130, "y": 230}
		})
		expect(inserted.isLeft()).toBeTrue()
	})

	it('Break path - start connecting to 203', () => {
		const inserted = TF.insertIntoPath(pathContinuousOpen)({
			"id": 203,
			"start": {"x": 120, "y": 220},
			"end": {"x": 930, "y": 930}
		})
		expect(inserted.isLeft()).toBeTrue()
	})

	it('Break path - end connecting to 203', () => {
		const inserted = TF.insertIntoPath(pathContinuousOpen)({
			"id": 999,
			"start": {"x": 920, "y": 920},
			"end": {"x": 130, "y": 230}
		})
		expect(inserted.isLeft()).toBeTrue()
	})

})

describe('flat-builder#prependToPath', () => {

	it('VectorConnection:NONE', () => {
		const res = TF.prependToPath(pathContinuousOpen)({
			"id": 999,
			"start": {"x": 920, "y": 920},
			"end": {"x": 333, "y": 222}
		})
		expect(res.isLeft()).toBeTrue()
	})

	it('VectorConnection:V1END_TO_V2START', () => {
		const res = TF.prependToPath(pathContinuousOpen)({
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
		const res = TF.prependToPath(pathContinuousOpen)({
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
		const res = TF.prependToPath(pathContinuousOpen)({
			"id": 999,
			"start": {"x": 920, "y": 920},
			"end": {"x": 110, "y": 210}
		})
		expect(res.isLeft()).toBeTrue()
	})

	it('VectorConnection:V1START_TO_V2END', () => {
		const res = TF.prependToPath(pathContinuousOpen)({
			"id": 999,
			"start": {"x": 110, "y": 210},
			"end": {"x": 333, "y": 444}
		})
		expect(res.isLeft()).toBeTrue()
	})

})

describe('flat-builder#appendToPath', () => {

	it('VectorConnection:NONE', () => {
		const res = TF.appendToPath(pathContinuousOpen)({
			"id": 999,
			"start": {"x": 920, "y": 920},
			"end": {"x": 333, "y": 222}
		})
		expect(res.isLeft()).toBeTrue()
	})

	it('VectorConnection:V1END_TO_V2START', () => {
		const res = TF.appendToPath(pathContinuousOpen)({
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
		const res = TF.appendToPath(pathContinuousOpen)({
			"id": 999,
			"start": {"x": 140, "y": 240},
			"end": {"x": 333, "y": 444}
		})
		expect(res.isLeft()).toBeTrue()
	})

	it('VectorConnection:V1END_TO_V2END', () => {
		const res = TF.appendToPath(pathContinuousOpen)({
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
		const res = TF.appendToPath(pathContinuousOpen)({
			"id": 999,
			"start": {"x": 111, "y": 222},
			"end": {"x": 140, "y": 240}
		})
		expect(res.isLeft()).toBeTrue()
	})
})

describe('flat-builder#insertIntoPaths', () => {

	it('Never start new path', () => {
		expect(TF.insertIntoPaths(pathCrossing300Full, getCCOById(102)).isLeft()).toBeTrue()
		expect(TF.insertIntoPaths(pathCrossing300Full, getCCOById(202)).isLeft()).toBeTrue()
		expect(TF.insertIntoPaths(pathCrossing300Full100Started, getCCOById(202)).isLeft()).toBeTrue()
	})

	it('Do not break closed path', () => {
		expect(TF.insertIntoPaths(pathCrossing300Full, getCCOById(301)).isLeft()).toBeTrue()
		expect(TF.insertIntoPaths(pathCrossing300Full, getCCOById(302)).isLeft()).toBeTrue()
	})

	it('Ignore already existing', () => {
		expect(TF.insertIntoPaths(pathCrossing300Full100Started, getCCOById(102)).isLeft()).toBeTrue()
	})

	it('Expand 102', () => {
		let path = TF.insertIntoPaths(pathCrossing300Full100Started, getCCOById(103)).get()
		expect(path[0].length).toEqual(2)
		expect(path[0][0].id).toEqual(102)
		expect(path[0][1].id).toEqual(103)

		path = TF.insertIntoPaths(path, getCCOById(101)).get()
		expect(path[0].length).toEqual(3)
		expect(path[0][0].id).toEqual(101)
		expect(path[0][1].id).toEqual(102)
		expect(path[0][2].id).toEqual(103)
	})

	it('Start new path', () => {
		let path = [...pathCrossing300Full100Started]
		path.push([getCCOById(202)])
		path = TF.insertIntoPaths(path, getCCOById(203)).get()
		expect(path[2].length).toEqual(2)
		expect(path[2][0].id).toEqual(202)
		expect(path[2][1].id).toEqual(203)
	})

})

describe('flat-builder#expandPaths', () => {

	it('Start new path', () => {
		const res = TF.expandPaths([getCCOById(203), getCCOById(103), getCCOById(104)], [])
		expect(res.skipped.length).toEqual(1)
		expect(res.paths.length).toEqual(1)

		expect(res.paths[0].length).toEqual(2)
		expect(res.paths[0][0].id).toEqual(103)
		expect(res.paths[0][1].id).toEqual(104)
	})

	it('Start new path 2', () => {
		const res = TF.expandPaths([getCCOById(103), getCCOById(302), getCCOById(102), getCCOById(203), getCCOById(303)], [])
		expect(res.skipped.length).toEqual(1)
		expect(res.paths.length).toEqual(2)

		expect(res.paths[0].length).toEqual(2)
		expect(res.paths[0][0].id).toEqual(102)
		expect(res.paths[0][1].id).toEqual(103)

		expect(res.paths[1].length).toEqual(2)
		expect(res.paths[1][0].id).toEqual(302)
		expect(res.paths[1][1].id).toEqual(303)
	})

	it('Inserting duplicate', () => {
		const res = TF.expandPaths([getCCOById(302)], pathCrossing300Full100Started)
		expect(res.skipped.length).toEqual(2)
		expect(res.skipped[0].id).toEqual(102)
		expect(res.skipped[1].id).toEqual(302)

		expect(res.paths.length).toEqual(1)
	})

	it('Build 300 do not connect crossings', () => {
		const res = TF.expandPaths([getCCOById(301), getCCOById(304)], pathCrossingsPartial, false)

		expect(res.skipped.length).toEqual(1)
		expect(res.paths.length).toEqual(2)

		// 301 and 304 are crossing, so they should not be connected directly.
		expect(res.paths[1].length).toEqual(4)
		expect(res.paths[1][0].id).toEqual(301)
		expect(res.paths[1][1].id).toEqual(302)
		expect(res.paths[1][2].id).toEqual(303)
		expect(res.paths[1][3].id).toEqual(304)
	})


	it('Build 300 connect crossings', () => {
		const res = TF.expandPaths([getCCOById(301), getCCOById(304)], pathCrossingsPartial, true)

		expect(res.paths.length).toEqual(2)

		expect(res.skipped.length).toEqual(1)
		expect(res.skipped[0].id).toEqual(203)

		// Crossing vectors can be directly connected - so 304 follows 301
		expect(res.paths[1].length).toEqual(4)
		expect(res.paths[1][0].id).toEqual(304)
		expect(res.paths[1][1].id).toEqual(301)
		expect(res.paths[1][2].id).toEqual(302)
		expect(res.paths[1][3].id).toEqual(303)
	})

	it('Build 200 connect crossings', () => {
		const res = TF.expandPaths([getCCOById(201), getCCOById(202), getCCOById(204)], pathCrossingsMissing200, true)
		expect(res.skipped.length).toEqual(0)
		expect(res.paths.length).toEqual(3)

		res.paths.forEach(p => expect(MF.pathContinuos(p)).toBeTrue())

		expect(res.paths[2].length).toEqual(4)
		expect(res.paths[2][0].id).toEqual(204)
		expect(res.paths[2][1].id).toEqual(201)
		expect(res.paths[2][2].id).toEqual(202)
		expect(res.paths[2][3].id).toEqual(203)
	})

	it('Build 200 do not connect crossings', () => {
		const res = TF.expandPaths([getCCOById(201), getCCOById(202), getCCOById(204)], pathCrossingsMissing200, false)

		expect(res.paths.length).toEqual(3)
		expect(res.paths[2].length).toEqual(3)
		expect(res.paths[2][0].id).toEqual(202)
		expect(res.paths[2][1].id).toEqual(203)
		expect(res.paths[2][2].id).toEqual(204)

		// 201 cannot be connected because both ends of the 200-path already have a crossing vector( 202 and 204)
		expect(res.skipped.length).toEqual(1)
		expect(res.skipped[0].id).toEqual(201)
	})

	it('Sector 39', () => {
		const res = TF.expandPaths(pathSector39, [])
		expect(res.paths.length).toEqual(1)
		expect(res.paths[0].length).toEqual(pathSector39.length)
		expect(MF.pathContinuos(res.paths[0])).toBeTrue()
	})

})

describe('flat-builder#sortByHoles', () => {
	it('Multiple paths', () => {
		const paths = TF.buildPaths(11, [...pathClosedMixed, ...pathClosedMixed2]).get()
		const sorted = TF.sortByHoles(paths)
		expect(sorted[0].length).toEqual(9)
		expect(sorted[1].length).toEqual(5)
	})
})

describe('flat-builder#groupByOuterPath', () => {

	it('Multiple paths', () => {
		const idx = TF.groupByOuterPath([pathClosedMixed, pathClosedMixed2])
		expect(idx).toEqual(0)
	})

	it('Multiple paths reversed', () => {
		const idx = TF.groupByOuterPath([pathClosedMixed2, pathClosedMixed])
		expect(idx).toEqual(1)
	})

})

describe('map-parser#createMaxVertex', () => {

	it('Path closed mixed', () => {
		const v = TF.createMaxVertex(pathClosedMixed)
		expect(v.x).toEqual(2048)
		expect(v.y).toEqual(-704)
	})

})
