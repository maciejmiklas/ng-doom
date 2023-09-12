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
import {functions as MF, VectorV} from './wad-model'
import {
	ALL_PATHS,
	E1M1_S37,
	E1M1_S39,
	E1M1_S72,
	E1M3_S66,
	E1M3_S7,
	E1M4_S36,
	E1M5_S18,
	getCCOById,
	PATH_CLOSED_1,
	PATH_CLOSED_MIXED,
	PATH_CLOSED_MIXED_2,
	PATH_CLOSED_REVERSED_MIX,
	PATH_CLOSED_REVERSED_ONE,
	PATH_CLOSED_SORTED,
	PATH_CONTINUOUS_OPEN,
	PATH_CROSSING_MIXED,
	pathCrossing300Full,
	pathCrossing300Full100Started,
	VectorId
} from "./testdata/data"
import {Either} from "../../common/either";

afterEach(() => {
	ALL_PATHS.forEach(TF.cleanFlags)
})

const expectClosedPath = (path: VectorId[]) => {
	expect(TF.pathContinuos(path)).toBeTrue()
}

const assertPaths = (pathsEi: Either<VectorV[][]>, size: number) => {
	expect(pathsEi.isRight()).toBeTrue()
	const paths = pathsEi.get()
	expect(paths.length).toEqual(size)

	for (let i = 0; i < paths.length; i++) {
		expect(TF.pathClosed(paths[i])).toBeTrue()
		expect(TF.pathContinuos(paths[i])).toBeTrue()
	}
}

describe('flat-builder#buildPaths', () => {

	// see testdata/E1M1_S37.jpg
	it('E1M1_S37', () => {
		const paths = TF.buildPaths(11, E1M1_S37).get()
		expect(paths.length).toEqual(3)
		paths.forEach(p => {
			expect(p.length).toEqual(4)
			expectClosedPath(p)
		})
	})

	// see testdata/E1M1_S39.jpg
	it('E1M1_S39', () => {
		const pathsEi = TF.buildPaths(39, E1M1_S39)
		assertPaths(pathsEi, 1)
	})

	// see testdata/E1M1_S72.jpg
	it('E1M1_S72', () => {
		const pathsEi = TF.buildPaths(72, E1M1_S72)
		assertPaths(pathsEi, 3)
	})

	// see testdata/E1M4_S7.jpg
	it('E1M3_S7', () => {
		const pathsEi = TF.buildPaths(7, E1M3_S7)
		assertPaths(pathsEi, 4)
	})

	// see testdata/E1M3_S66.jpg
	it('E1M3_S66', () => {
		const pathsEi = TF.buildPaths(66, E1M3_S66);
		assertPaths(pathsEi, 2)
	})

	// see testdata/E1M4_S36.png
	it('E1M4_S36', () => {
		const pathsEi = TF.buildPaths(36, E1M4_S36);
		assertPaths(pathsEi, 2)
	})

	// see testdata/E1M5_S18.jpg
	it('E1M5_S18', () => {
		const pathsEi = TF.buildPaths(36, E1M5_S18);
		assertPaths(pathsEi, 3)
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

const assertNotBox = (res: Either<VectorV[][]>) => {
	expect(res.isLeft()).toBeTrue()
	expect(res.message()).toContain('is not a simple box')
}

const assertPathsContinuos = (res: Either<VectorV[][]>, length = 1) => {
	expect(res.isRight()).withContext(res.message()).toBeTrue()
	assertPathsArrContinuos(res.get(), length)
}

const assertPathsArrContinuos = (res: VectorV[][], length = 1) => {
	expect(res.length).toEqual(length)
	res.forEach(path => expect(TF.pathContinuos(path)))
};

describe('flat-builder#expandPaths', () => {

	it('E1M1_S39', () => {
		TF.markDuplicatedVectors(E1M1_S39)
		TF.markCrossingVectors(E1M1_S39)
		const res = TF.expandPaths(E1M1_S39, [])
		assertPathsArrContinuos(res.paths)
		expect(res.skipped.length).toEqual(0)
	})

	it('E1M1_S72', () => {
		TF.markDuplicatedVectors(E1M1_S72)
		TF.markCrossingVectors(E1M1_S72)
		const res = TF.expandPaths(E1M1_S72, [])
		assertPathsArrContinuos(res.paths, 3)
		expect(res.skipped.length).toEqual(0)
	})

	it('E1M3_S7', () => {
		TF.markDuplicatedVectors(E1M3_S7)
		TF.markCrossingVectors(E1M3_S7)

		// first iteration
		const res1 = TF.expandPaths(E1M3_S7, [])
		assertPathsArrContinuos(res1.paths, 5)
		expect(res1.skipped.length).toBeGreaterThanOrEqual(1)

		// second iteration
		const res2 = TF.expandPaths(res1.skipped, res1.paths)
		assertPathsArrContinuos(res2.paths, 5)
		expect(res2.skipped.length).toEqual(0)
	})

	it('E1M3_S66', () => {
		TF.markDuplicatedVectors(E1M3_S66)
		TF.markCrossingVectors(E1M3_S66)
		const res = TF.expandPaths(E1M3_S66, [])
		assertPathsArrContinuos(res.paths, 2)
		expect(res.skipped.length).toEqual(0)
	})

	it('E1M4_S36', () => {
		TF.markDuplicatedVectors(E1M4_S36)
		TF.markCrossingVectors(E1M4_S36)
		const res = TF.expandPaths(E1M4_S36, [])
		assertPathsArrContinuos(res.paths, 2)
		expect(res.skipped.length).toEqual(0)
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

describe('flat-builder#createMaxVertex', () => {

	it('Path closed mixed', () => {
		const v = TF.createMaxVertex(PATH_CLOSED_MIXED)
		expect(v.x).toEqual(2048)
		expect(v.y).toEqual(-704)
	})
})

describe('flat-builder#isCrossingVector', () => {

	it('no flag', () => {
		const vv = {
			"id": 988,
			"start": {"x": -1552, "y": -2640},
			"end": {"x": -1408, "y": -2944},
		}
		expect(TF.isCrossingVector(vv)).toBeFalse()
	})

	it('flag true', () => {
		const vv = {
			"id": 988,
			"start": {"x": -1552, "y": -2640},
			"end": {"x": -1408, "y": -2944},
		}
		TF.setCrossing(vv)
		expect(TF.isCrossingVector(vv)).toBeTrue()
	})
})

describe('flat-builder#firstNotCrossingPos', () => {

	it('none', () => {
		TF.markCrossingVectors(E1M3_S66)
		const found = TF.firstNotCrossingPos(E1M3_S66)
		expect(found.isLeft()).toBeTrue()
	})

	it('all crossing', () => {
		TF.markCrossingVectors(E1M3_S66)
		const found = TF.firstNotCrossingPos(E1M3_S66)
		expect(found.isLeft()).toBeTrue()
	})

	it('found', () => {
		TF.markCrossingVectors(E1M4_S36)
		const found = TF.firstNotCrossingPos(E1M4_S36)
		expect(found.isRight()).toBeTrue()
	})
})


const firstCrossingDuplicatePosFound = (vv: VectorId[], pos: number) => {
	TF.markDuplicatedVectors(vv)
	TF.markCrossingVectors(vv)
	const found = TF.firstCrossingDuplicatePos(vv)
	expect(found.isRight()).toBeTrue()
	expect(found.get()).toEqual(pos);
}

const firstCrossingDuplicatePosNotFound = (vv: VectorId[]) => {
	TF.markDuplicatedVectors(vv)
	TF.markCrossingVectors(vv)
	const found = TF.firstCrossingDuplicatePos(vv)
	expect(found.isLeft()).toBeTrue()
}

describe('flat-builder#firstCrossingDuplicatePos', () => {

	it('E1M1_S39 - none', () => {
		firstCrossingDuplicatePosNotFound(E1M1_S39)
	})

	it('E1M1_S72 - found', () => {
		firstCrossingDuplicatePosFound(E1M1_S72, 8);
	})

	it('E1M3_S7 - none', () => {
		firstCrossingDuplicatePosNotFound(E1M3_S7)
	})

	it('E1M3_S66 - found', () => {
		firstCrossingDuplicatePosFound(E1M3_S66, 4);
	})

	it('E1M4_S36 - found', () => {
		firstCrossingDuplicatePosFound(E1M4_S36, 4);
	})
})

describe('flat-builder#firstDuplicatePos', () => {

	it('found 1', () => {
		TF.markDuplicatedVectors(E1M4_S36)
		const found = TF.firstDuplicatePos(E1M4_S36)
		expect(found.isRight()).toBeTrue()
		expect(found.get()).toEqual(4)
	})

	it('found 2', () => {
		TF.markDuplicatedVectors(E1M3_S66)
		const found = TF.firstDuplicatePos(E1M3_S66)
		expect(found.isRight()).toBeTrue()
		expect(found.get()).toEqual(4)
	})

	it('not found 1', () => {
		TF.markDuplicatedVectors(PATH_CLOSED_1)
		expect(TF.firstDuplicatePos(PATH_CLOSED_1).isLeft()).toBeTrue()
	})

	it('not found 2', () => {
		TF.markDuplicatedVectors(PATH_CONTINUOUS_OPEN)
		expect(TF.firstDuplicatePos(PATH_CONTINUOUS_OPEN).isLeft()).toBeTrue()
	})

	it('not found 3', () => {
		TF.markDuplicatedVectors(PATH_CLOSED_MIXED)
		expect(TF.firstDuplicatePos(PATH_CLOSED_MIXED).isLeft()).toBeTrue()
	})

	it('not found 4', () => {
		TF.markDuplicatedVectors(PATH_CLOSED_SORTED)
		expect(TF.firstDuplicatePos(PATH_CLOSED_SORTED).isLeft()).toBeTrue()
	})

	it('not found 5', () => {
		TF.markDuplicatedVectors(PATH_CLOSED_MIXED_2)
		expect(TF.firstDuplicatePos(PATH_CLOSED_MIXED_2).isLeft()).toBeTrue()
	})

	it('not found 6', () => {
		TF.markDuplicatedVectors(PATH_CLOSED_REVERSED_ONE)
		expect(TF.firstDuplicatePos(PATH_CLOSED_REVERSED_ONE).isLeft()).toBeTrue()
	})

	it('not found 7', () => {
		TF.markDuplicatedVectors(PATH_CLOSED_REVERSED_MIX)
		expect(TF.firstDuplicatePos(PATH_CLOSED_REVERSED_MIX).isLeft()).toBeTrue()
	})

	it('not found 8', () => {
		TF.markDuplicatedVectors(E1M1_S37)
		expect(TF.firstDuplicatePos(E1M1_S37).isLeft()).toBeTrue()
	})

	it('not found 9', () => {
		TF.markDuplicatedVectors(PATH_CROSSING_MIXED)
		expect(TF.firstDuplicatePos(PATH_CROSSING_MIXED).isLeft()).toBeTrue()
	})

	it('not found 10', () => {
		TF.markDuplicatedVectors(E1M1_S39)
		expect(TF.firstDuplicatePos(E1M1_S39).isLeft()).toBeTrue()
	})

	it('E1M5_S18 - 478 starting from 0', () => {
		TF.markDuplicatedVectors(E1M5_S18)
		expect(TF.firstDuplicatePos(E1M5_S18).get()).toEqual(3)
	})

	it('E1M5_S18 - 478 starting from 2', () => {
		TF.markDuplicatedVectors(E1M5_S18)
		expect(TF.firstDuplicatePos(E1M5_S18, 2).get()).toEqual(3)
	})

	it('E1M5_S18 - 479 starting from 4', () => {
		TF.markDuplicatedVectors(E1M5_S18)
		expect(TF.firstDuplicatePos(E1M5_S18, 4).get()).toEqual(4)
	})

	it('E1M5_S18 - 479 starting from 6', () => {
		TF.markDuplicatedVectors(E1M5_S18)
		expect(TF.firstDuplicatePos(E1M5_S18, 6).get()).toEqual(8)
	})

	it('E1M5_S18 - none starting from 10', () => {
		TF.markDuplicatedVectors(E1M5_S18)
		expect(TF.firstDuplicatePos(E1M5_S18, 10).isLeft()).toBeTrue()
	})
})

describe('flat-builder#firstVectorByVertex', () => {

	it('found', () => {
		expect(TF.firstVectorByVertex(PATH_CROSSING_MIXED)({"x": 1184, "y": -3360}).get()).toEqual(5)
	})

	it('not found', () => {
		expect(TF.firstVectorByVertex(PATH_CROSSING_MIXED)({"x": 928, "y": 3360}).isLeft()).toBeTruthy()
	})
})

describe('flat-builder#groupByVertex', () => {

	it('Found', () => {
		const v = {"x": 928, "y": -3104}
		const either = TF.groupByVertex(PATH_CROSSING_MIXED)(v)
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
		const either = TF.groupByVertex(PATH_CROSSING_MIXED)({"x": 928, "y": 3360})
		expect(either.isRight()).toBeFalse()
	})
})

describe('flat-builder#duplicatedIds', () => {

	it('E1M1_S39', () => {
		const ret = TF.duplicatedIds(E1M1_S39)
		expect(ret.isLeft()).toBeTrue()
	})

	it('E1M1_S72', () => {
		const ret = TF.duplicatedIds(E1M1_S72).get()
		expect(ret.length).toEqual(6)
	})

	it('E1M3_S7', () => {
		const ret = TF.duplicatedIds(E1M3_S7)
		expect(ret.isLeft()).toBeTrue()
	})

	it('E1M3_S66', () => {
		const ret = TF.duplicatedIds(E1M3_S66).get()
		expect(ret.length).toEqual(1)
	})
	it('E1M4_S36', () => {
		const ret = TF.duplicatedIds(E1M4_S36).get()
		expect(ret.length).toEqual(1)
	})
})

const assertDuplicate = (vectors: VectorId[], ...ids: number[]) => {
	const dupIds = vectors.filter(TF.isDuplicatedVector).map(v => v.id)
	expect(dupIds.length).toEqual(ids.length * 2)
	ids.forEach(id => {
		expect(dupIds.find(vid => vid == id)).withContext('Duplicates: ' + dupIds).toBeGreaterThanOrEqual(0)
	})
}

describe('flat-builder#markDuplicatedVectors', () => {

	it('E1M1_S39', () => {
		TF.markDuplicatedVectors(E1M1_S39)
		expect(E1M1_S39.filter(TF.isDuplicatedVector).length).toEqual(0)
	})

	it('E1M1_S72', () => {
		TF.markDuplicatedVectors(E1M1_S72)
		assertDuplicate(E1M1_S72, 300, 299, 298, 302, 303, 301)
	})

	it('E1M3_S7', () => {
		TF.markDuplicatedVectors(E1M3_S7)
		expect(E1M3_S7.filter(TF.isDuplicatedVector).length).toEqual(0)
	})

	it('E1M3_S66', () => {
		TF.markDuplicatedVectors(E1M3_S66)
		assertDuplicate(E1M3_S66, 988)
	})

	it('E1M4_S36', () => {
		TF.markDuplicatedVectors(E1M4_S36)
		assertDuplicate(E1M4_S36, 537)
	})
})

describe('flat-builder#crossingVertexes', () => {

	it('E1M1_S39 - no crossings', () => {
		const ret = TF.crossingVertexes(E1M1_S39)
		expect(ret.length).toEqual(0)
	})

	it('E1M1_S72 - some are crossing', () => {
		const ret = TF.crossingVertexes(E1M1_S72)
		expect(ret.length).toEqual(4)
	})

	it('E1M3_S7 - no crossings', () => {
		const ret = TF.crossingVertexes(E1M3_S7)
		expect(ret.length).toEqual(0)
	})

	it('E1M3_S66 - all are crossing', () => {
		const ret = TF.crossingVertexes(E1M3_S66)
		expect(ret.length).toEqual(2)
	})

	it('E1M4_S36 - some are crossing', () => {
		const ret = TF.crossingVertexes(E1M4_S36)
		expect(ret.length).toEqual(2)
	})
})

const assertCrossing = (vectors: VectorId[], ...ids: number[]) => {
	const crossIds = vectors.filter(TF.isCrossingVector).map(v => v.id)
	expect(crossIds.length).withContext('Crossings: ' + crossIds).toEqual(ids.length)
	ids.forEach(id => {
		expect(crossIds.find(vid => vid == id)).withContext('Crossings: ' + crossIds).toBeGreaterThanOrEqual(0)
	})
}

describe('flat-builder#markCrossingVectors', () => {

	it('E1M1_S39 - no crossings', () => {
		expect(E1M1_S39.filter(TF.isCrossingVector).length).toEqual(0)

		TF.markCrossingVectors(E1M1_S39)
		expect(E1M1_S39.filter(TF.isCrossingVector).length).toEqual(0)
	})

	it('E1M1_S72 - some are crossing', () => {
		expect(E1M1_S72.filter(TF.isCrossingVector).length).toEqual(0)

		TF.markCrossingVectors(E1M1_S72)
		assertCrossing(E1M1_S72, 290, 291, 292, 293, 294, 295, 296, 297, 298, 300, 301, 302, 298, 300, 301, 302)

		expect(E1M1_S72.filter(TF.isCrossingVector).length).toEqual(16)
	})

	it('E1M3_S7 - no crossings', () => {
		expect(E1M3_S7.filter(TF.isCrossingVector).length).toEqual(0)

		TF.markCrossingVectors(E1M3_S7)
		expect(E1M3_S7.filter(TF.isCrossingVector).length).toEqual(0)
	})

	it('E1M3_S66 - all are crossing', () => {
		expect(E1M3_S66.filter(TF.isCrossingVector).length).toEqual(0)

		TF.markCrossingVectors(E1M3_S66)
		expect(E1M3_S66.filter(TF.isCrossingVector).length).toEqual(6)

		TF.cleanFlags(E1M3_S66)
		expect(E1M3_S66.filter(TF.isCrossingVector).length).toEqual(0)
	})

	it('E1M4_S36 - some are crossing', () => {
		expect(E1M4_S36.filter(TF.isCrossingVector).length).toEqual(0)

		TF.markCrossingVectors(E1M4_S36)
		assertCrossing(E1M4_S36, 523, 524, 531, 532, 537, 537)

		TF.cleanFlags(E1M4_S36)
		expect(E1M4_S36.filter(TF.isCrossingVector).length).toEqual(0)
	})
})

describe('flat-builder#pathClosed', () => {

	it('closed', () => {
		expect(TF.pathClosed(PATH_CLOSED_SORTED)).toBeTrue()
		expect(TF.pathOpen(PATH_CLOSED_SORTED)).toBeFalse()
	})

	it('not closed', () => {
		expect(TF.pathClosed(PATH_CLOSED_MIXED)).toBeFalse()
		expect(TF.pathOpen(PATH_CLOSED_MIXED)).toBeTrue()
	})
})

describe('flat-builder#pathContinuos', () => {

	it('Closed', () => {
		expect(TF.pathContinuos(PATH_CLOSED_SORTED)).toBeTrue()
	})

	it('Mixed', () => {
		expect(TF.pathContinuos(PATH_CLOSED_MIXED)).toBeFalse()
	})

	it('Mixed 2', () => {
		expect(TF.pathContinuos(PATH_CLOSED_MIXED_2)).toBeFalse()
	})

	it('Reversed one', () => {
		expect(TF.pathContinuos(PATH_CLOSED_REVERSED_ONE)).toBeFalse()
	})

	it('Reversed mix', () => {
		expect(TF.pathContinuos(PATH_CLOSED_REVERSED_MIX)).toBeFalse()
	})

	it('Continuous open', () => {
		expect(TF.pathContinuos(PATH_CONTINUOUS_OPEN)).toBeFalse()
	})
})

describe('flat-builder#closePath', () => {
	it('Continuous Open', () => {
		const path = TF.closePath(PATH_CONTINUOUS_OPEN)
		const pol = PATH_CONTINUOUS_OPEN.length
		expect(path.length).toEqual(pol + 1)
		const newVector = path[pol]
		expect(PATH_CONTINUOUS_OPEN[pol - 1].id).toEqual(path[path.length - 2].id)
		expect(MF.vertexEqual(newVector.start, PATH_CONTINUOUS_OPEN[pol - 1].end)).toBeTrue()
		expect(MF.vertexEqual(newVector.end, PATH_CONTINUOUS_OPEN[0].start)).toBeTrue()
	})
})

describe('flat-builder#vectorSortWeight', () => {

	it('regular', () => {
		expect(TF.vectorSortWeight({
			"id": 583,
			"start": {"x": -448, "y": -1728},
			"end": {"x": -536, "y": -1728}
		})).toEqual(583)
	})

	it('crossing', () => {
		const vec = {"id": 583, "start": {"x": -448, "y": -1728}, "end": {"x": -536, "y": -1728}}
		TF.setCrossing(vec)
		expect(TF.vectorSortWeight(vec)).toEqual(10000 + 583)
	})

	it('duplicated', () => {
		const vec = {"id": 583, "start": {"x": -448, "y": -1728}, "end": {"x": -536, "y": -1728}}
		TF.setDuplicated(vec)
		expect(TF.vectorSortWeight(vec)).toEqual(11000 + 583)
	})

	it('crossing and duplicated', () => {
		const vec = {"id": 583, "start": {"x": -448, "y": -1728}, "end": {"x": -536, "y": -1728}}
		TF.setCrossing(vec)
		TF.setDuplicated(vec)
		expect(TF.vectorSortWeight(vec)).toEqual(10000 + 11000 + 583)
	})
})

describe('flat-builder#sortForExpand', () => {

	it('E1M1_S72', () => {
		TF.markCrossingVectors(E1M1_S72)
		TF.markDuplicatedVectors(E1M1_S72)
		const sorted = TF.sortForExpand(E1M1_S72)

		// 1) crossing and duplicated on the top
		for (let i = 0; i <= 7; i++) {
			expect(TF.isCrossingVector(sorted[i])).toBeTrue()
			expect(TF.isDuplicatedVector(sorted[i])).toBeTrue()
		}

		// 2) duplicates
		for (let i = 8; i <= 11; i++) {
			expect(TF.isCrossingVector(sorted[i])).toBeFalse()
			expect(TF.isDuplicatedVector(sorted[i])).toBeTrue()
		}

		// 3) crossings
		for (let i = 12; i <= 19; i++) {
			expect(TF.isCrossingVector(sorted[i])).toBeTrue()
			expect(TF.isDuplicatedVector(sorted[i])).toBeFalse()
		}

		// 4) remaining
		for (let i = 20; i < E1M1_S72.length; i++) {
			expect(TF.isCrossingVector(sorted[i])).toBeFalse()
			expect(TF.isDuplicatedVector(sorted[i])).toBeFalse()
		}
	})


	it('E1M3_S66', () => {
		TF.markCrossingVectors(E1M3_S66)
		TF.markDuplicatedVectors(E1M3_S66)
		const sorted = TF.sortForExpand(E1M3_S66)

		// 1) crossing and duplicated on the top
		for (let i = 0; i <= 1; i++) {
			expect(TF.isCrossingVector(sorted[i])).toBeTrue()
			expect(TF.isDuplicatedVector(sorted[i])).toBeTrue()
		}

		// 2) duplicates
		for (let i = 2; i < E1M3_S66.length; i++) {
			expect(TF.isDuplicatedVector(sorted[i])).toBeFalse()
		}

		// 3) crossings
		for (let i = 0; i < E1M3_S66.length; i++) {
			expect(TF.isCrossingVector(sorted[i])).toBeTrue()
		}
	})
})



