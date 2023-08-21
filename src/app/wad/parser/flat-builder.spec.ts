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
import * as R from 'ramda'
import {testFunctions as TF} from './flat-builder'
import {functions as MF, VectorV} from './wad-model'
import {
	E1M1_S37,
	E1M1_S39,
	E1M3_S66,
	E1M3_S7,
	E1M4_S36,
	getCCOById,
	PATH_CLOSED_MIXED,
	PATH_CLOSED_MIXED_2,
	PATH_CLOSED_REVERSED_MIX,
	PATH_CLOSED_REVERSED_ONE,
	PATH_CLOSED_SORTED,
	PATH_CONTINUOUS_OPEN,
	PATH_CROSSING_MIXED,
	pathCrossing300Full,
	pathCrossing300Full100Started,
	pathCrossingsMissing200,
	pathCrossingsPartial,
	VectorId
} from "./testdata/data"
import {Either} from "../../common/either";


const expectClosedPath = (path: VectorId[]) => {
	expect(MF.pathContinuos(path)).toBeTrue()
}

const assertPaths = (pathsEi: Either<VectorV[][]>, size: number) => {
	expect(pathsEi.isRight()).toBeTrue()
	const paths = pathsEi.val
	expect(paths.length).toEqual(size)

	for (let i = 0; i < paths.length; i++) {
		expect(MF.pathClosed(paths[i])).toBeTrue()
		expect(MF.pathContinuos(paths[i])).toBeTrue()
	}
}

const assertDoesNotContainLinedef = (pathsEi: Either<VectorV[][]>, ldIdx: number) => {
	expect(pathsEi.isRight()).toBeTrue()
	expect(R.flatten(pathsEi.val).filter(v => v.id === ldIdx).length).withContext('Contains linedef: ' + ldIdx).toEqual(0)
}

describe('flat-builder#buildPaths', () => {

	// see testdata/E1M3-S66.png
	it('E1M3 - sector 66', () => {
		const pathsEi = TF.buildPaths(66, E1M3_S66);
		assertPaths(pathsEi, 1)
		assertDoesNotContainLinedef(pathsEi, 988)
	})

	// see testdata/E1M4-S36.png
	it('E1M4 - sector 36', () => {
		const pathsEi1 = TF.buildPaths(36, E1M4_S36);
		assertPaths(pathsEi1, 2)
	})

	// see testdata/E1M4-S7.png
	it('E1M3 - sector 7', () => {
		const pathsEi = TF.buildPaths(7, E1M3_S7)
		assertPaths(pathsEi, 4)
	})


	it('Path crossing ordered', () => {
		const paths = TF.buildPaths(11, E1M1_S37).get()
		expect(paths.length).toEqual(3)
		paths.forEach(p => {
			expect(p.length).toEqual(4)
			expectClosedPath(p)
		})
	})

	it('Path closed reversed mix', () => {
		const path = TF.buildPaths(11, PATH_CLOSED_REVERSED_MIX).get()
		expect(path.length).toEqual(1)
		expect(path[0].length).toEqual(8)
		expectClosedPath(path[0])
	})

	it('Path closed mixed', () => {
		const path = TF.buildPaths(11, PATH_CLOSED_MIXED).get()
		expect(path.length).toEqual(1)
		expect(path[0].length).toEqual(9)
		expectClosedPath(path[0])
	})

	it('Path closed mixed 2', () => {
		const path = TF.buildPaths(11, PATH_CLOSED_MIXED_2).get()
		expect(path.length).toEqual(1)
		expect(path[0].length).toEqual(5)
		expectClosedPath(path[0])
	})

	it('Path closed mixed and sorted', () => {
		const paths = TF.buildPaths(11, PATH_CLOSED_SORTED).get()
		expect(paths.length).toEqual(1)
		expect(paths[0].length).toEqual(9)
		expectClosedPath(paths[0])
	})

	it('Two Paths', () => {
		const paths = TF.buildPaths(11, [...PATH_CLOSED_MIXED, ...PATH_CLOSED_MIXED_2]).get()
		expect(paths.length).toEqual(2)
		expect(paths[0].length).toEqual(9)
		expect(paths[1].length).toEqual(5)
		expectClosedPath(paths[0])
		expectClosedPath(paths[1])
	})

	it('Path closed vectors reversed', () => {
		const paths = TF.buildPaths(11, PATH_CLOSED_REVERSED_ONE).get()
		expect(paths.length).toEqual(1)
		expect(paths[0].length).toEqual(5)
		expectClosedPath(paths[0])
	})
})

describe('flat-builder#insertIntoPath', () => {

	it('Insert on the start do not reverse', () => {
		const inserted = TF.insertIntoPath(PATH_CONTINUOUS_OPEN)({
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
		const inserted = TF.insertIntoPath(PATH_CONTINUOUS_OPEN)({
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
		const inserted = TF.insertIntoPath(PATH_CONTINUOUS_OPEN)({
			"id": 999,
			"start": {"x": 120, "y": 220},
			"end": {"x": 130, "y": 230}
		})
		expect(inserted.isLeft()).toBeTrue()
	})

	it('Break path - start connecting to 203', () => {
		const inserted = TF.insertIntoPath(PATH_CONTINUOUS_OPEN)({
			"id": 203,
			"start": {"x": 120, "y": 220},
			"end": {"x": 930, "y": 930}
		})
		expect(inserted.isLeft()).toBeTrue()
	})

	it('Break path - end connecting to 203', () => {
		const inserted = TF.insertIntoPath(PATH_CONTINUOUS_OPEN)({
			"id": 999,
			"start": {"x": 920, "y": 920},
			"end": {"x": 130, "y": 230}
		})
		expect(inserted.isLeft()).toBeTrue()
	})

})

describe('flat-builder#prependToPath', () => {

	it('VectorConnection:NONE', () => {
		const res = TF.prependToPath(PATH_CONTINUOUS_OPEN)({
			"id": 999,
			"start": {"x": 920, "y": 920},
			"end": {"x": 333, "y": 222}
		})
		expect(res.isLeft()).toBeTrue()
	})

	it('VectorConnection:V1END_TO_V2START', () => {
		const res = TF.prependToPath(PATH_CONTINUOUS_OPEN)({
			"id": 999,
			"start": {"x": 920, "y": 920},
			"end": {"x": 100, "y": 200}
		})
		expect(res.isRight()).toBeTrue()
		expect(res.get()[0].id).toEqual(999);
		expect(res.get()[0].start.x).toEqual(920);
		expect(res.get().length).toEqual(PATH_CONTINUOUS_OPEN.length + 1);
	})


	it('VectorConnection:V1START_TO_V2START', () => {
		const res = TF.prependToPath(PATH_CONTINUOUS_OPEN)({
			"id": 999,
			"start": {"x": 100, "y": 200},
			"end": {"x": 333, "y": 444}
		})
		expect(res.isRight()).toBeTrue()
		expect(res.get()[0].id).toEqual(999);
		expect(res.get()[0].start.x).toEqual(333);
		expect(res.get().length).toEqual(PATH_CONTINUOUS_OPEN.length + 1);
	})

	it('VectorConnection:V1END_TO_V2END', () => {
		const res = TF.prependToPath(PATH_CONTINUOUS_OPEN)({
			"id": 999,
			"start": {"x": 920, "y": 920},
			"end": {"x": 110, "y": 210}
		})
		expect(res.isLeft()).toBeTrue()
	})

	it('VectorConnection:V1START_TO_V2END', () => {
		const res = TF.prependToPath(PATH_CONTINUOUS_OPEN)({
			"id": 999,
			"start": {"x": 110, "y": 210},
			"end": {"x": 333, "y": 444}
		})
		expect(res.isLeft()).toBeTrue()
	})

})

describe('flat-builder#appendToPath', () => {

	it('VectorConnection:NONE', () => {
		const res = TF.appendToPath(PATH_CONTINUOUS_OPEN)({
			"id": 999,
			"start": {"x": 920, "y": 920},
			"end": {"x": 333, "y": 222}
		})
		expect(res.isLeft()).toBeTrue()
	})

	it('VectorConnection:V1END_TO_V2START', () => {
		const res = TF.appendToPath(PATH_CONTINUOUS_OPEN)({
			"id": 999,
			"start": {"x": 150, "y": 250},
			"end": {"x": 111, "y": 222}
		})
		expect(res.isRight()).toBeTrue()
		const el = res.get()[PATH_CONTINUOUS_OPEN.length];
		expect(el.id).toEqual(999);
		expect(el.start.x).toEqual(150);
		expect(res.get().length).toEqual(PATH_CONTINUOUS_OPEN.length + 1);
	})


	it('VectorConnection:V1START_TO_V2START', () => {
		const res = TF.appendToPath(PATH_CONTINUOUS_OPEN)({
			"id": 999,
			"start": {"x": 140, "y": 240},
			"end": {"x": 333, "y": 444}
		})
		expect(res.isLeft()).toBeTrue()
	})

	it('VectorConnection:V1END_TO_V2END', () => {
		const res = TF.appendToPath(PATH_CONTINUOUS_OPEN)({
			"id": 999,
			"start": {"x": 920, "y": 920},
			"end": {"x": 150, "y": 250}
		})
		expect(res.isRight()).toBeTrue()
		const el = res.get()[PATH_CONTINUOUS_OPEN.length];
		expect(el.id).toEqual(999);
		expect(el.start.x).toEqual(150);
		expect(res.get().length).toEqual(PATH_CONTINUOUS_OPEN.length + 1);
	})

	it('VectorConnection:V1START_TO_V2END', () => {
		const res = TF.appendToPath(PATH_CONTINUOUS_OPEN)({
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
		expect(res.paths[1][0].id).toEqual(301)
		expect(res.paths[1][1].id).toEqual(302)
		expect(res.paths[1][2].id).toEqual(303)
		expect(res.paths[1][3].id).toEqual(304)
	})

	it('Build 200 connect crossings', () => {
		const res = TF.expandPaths([getCCOById(201), getCCOById(202), getCCOById(204)], pathCrossingsMissing200, true)
		expect(res.skipped.length).toEqual(0)
		expect(res.paths.length).toEqual(3)

		res.paths.forEach(p => expect(MF.pathContinuos(p)).toBeTrue())

		expect(res.paths[2].length).toEqual(4)
		expect(res.paths[2][0].id).toEqual(201)
		expect(res.paths[2][1].id).toEqual(202)
		expect(res.paths[2][2].id).toEqual(203)
		expect(res.paths[2][3].id).toEqual(204)
	})

	it('Sector 39', () => {
		const res = TF.expandPaths(E1M1_S39, [])
		expect(res.paths.length).toEqual(1)
		expect(res.paths[0].length).toEqual(E1M1_S39.length)
		expect(MF.pathContinuos(res.paths[0])).toBeTrue()
	})

})

describe('flat-builder#sortByHoles', () => {
	it('Multiple paths', () => {
		const paths = TF.buildPaths(11, [...PATH_CLOSED_MIXED, ...PATH_CLOSED_MIXED_2]).get()
		const sorted = TF.sortByHoles(paths)
		expect(sorted[0].length).toEqual(9)
		expect(sorted[1].length).toEqual(5)
	})
})

describe('flat-builder#groupByOuterPath', () => {

	it('Multiple paths', () => {
		const idx = TF.groupByOuterPath([PATH_CLOSED_MIXED, PATH_CLOSED_MIXED_2])
		expect(idx).toEqual(0)
	})

	it('Multiple paths reversed', () => {
		const idx = TF.groupByOuterPath([PATH_CLOSED_MIXED_2, PATH_CLOSED_MIXED])
		expect(idx).toEqual(1)
	})

})

describe('map-parser#createMaxVertex', () => {

	it('Path closed mixed', () => {
		const v = TF.createMaxVertex(PATH_CLOSED_MIXED)
		expect(v.x).toEqual(2048)
		expect(v.y).toEqual(-704)
	})

})
