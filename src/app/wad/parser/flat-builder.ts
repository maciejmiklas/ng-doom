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
import {Either, LeftType} from '../../common/either'
import {
	Flat,
	FlatArea,
	FlatType,
	FlatWithHoles,
	FlatWithShapes,
	functions as MF,
	Linedef,
	MIN_VECTOR_V,
	Sector,
	VectorConnection,
	VectorV,
	Vertex
} from './wad-model'
import {Log} from "../../common/log";
import U from "../../common/util";
import {config as MC} from "./parser-config"

const CMP = 'FLB'

type ExpandResult<V extends VectorV> = {
	paths: V[][],
	skipped: V[]
}

const CROSSING_FLAG = "crossing";
const setCrossing = (v: VectorV) => v[CROSSING_FLAG] = true
const cleanCrossing = (v: VectorV) => v[CROSSING_FLAG] = undefined
const cleanCrossingVectors = (vectors: VectorV[]): void => vectors.forEach(cleanCrossing)
const isCrossingVector = (v: VectorV) => R.isNotNil(v) && R.isNotNil(v[CROSSING_FLAG]) && v[CROSSING_FLAG] === true
const isNotCrossingVector = (v: VectorV) => !isCrossingVector(v)

const DUPLICATED_FLAG = "duplicate";
const setDuplicated = (v: VectorV) => v[DUPLICATED_FLAG] = true
const cleanDuplicated = (v: VectorV) => v[DUPLICATED_FLAG] = undefined
const cleanDuplicatedVectors = (vectors: VectorV[]): void => vectors.forEach(cleanDuplicated)
const isDuplicatedVector = (v: VectorV) => R.isNotNil(v) && R.isNotNil(v[DUPLICATED_FLAG]) && v[DUPLICATED_FLAG] === true
const isNotDuplicatedVector = (v: VectorV) => !isDuplicatedVector(v)

const cleanFlags = (vectors: VectorV[]): void => {
	cleanCrossingVectors(vectors)
	cleanDuplicatedVectors(vectors)
}

const areCrossing = (v1: VectorV, v2: VectorV) => isCrossingVector(v1) && isCrossingVector(v2)

const buildPaths = <V extends VectorV>(sectorId: number, vectors: V[]): Either<V[][]> => {
	Log.debug(CMP, 'Build paths for Sector: ', sectorId)
	markCrossingVectors(vectors)
	markDuplicatedVectors(vectors)

	const res = R.pipe<V[][], ExpandResult<V>, ExpandResult<V>, ExpandResult<V>, ExpandResult<V>>(
		// try to build paths only by appending elements on the end of existing paths
		v => expandPaths(v, []),

		// the first iteration left some unused vectors, try prepending or appending those into existing paths
		R.when(v => v.skipped.length > 0, v => expandPaths(v.skipped, v.paths, true)),

		// some paths are still open, maybe they can be connected together?
		R.when(v => v.paths.filter(pathOpen).length > 0, joinPaths),

		// just close remaining open paths
		R.when(v => v.paths.filter(pathOpen).length > 0, closePaths)
	)(vectors)

	if (res.skipped.length > 0) {
		Log.debug(CMP, 'Sector:', sectorId, 'contains', res.skipped.length, 'skipped vectors')
	}

	return Either.ofConditionC<ExpandResult<V>, V[][]>(
		v => v.skipped.length <= MC.flat.maxSkip, // many open paths are any good
		v => () => 'Sector: ' + sectorId + ' contains ' + v.skipped.length + '  skipped vectors',
		v => v.paths)(res);
}

// for now it's limited to one open path
const joinPaths = <V extends VectorV>(inp: ExpandResult<V>): ExpandResult<V> => {
	const openPaths = inp.paths.filter(pathOpen)
	const closedPaths = inp.paths.filter(pathClosed)
	if (openPaths.length == 0) {
		return inp;
	}
	const open = sortBySize(openPaths)

	// take the longest path and try joining the remaining elements into it
	const path = open.splice(0, 1)[0]
	const expanded = expandPaths(open.flat(), [path], true)

	return {
		paths: [...expanded.paths, ...closedPaths],
		skipped: expanded.skipped
	}
}

const closePaths = <V extends VectorV>(inp: ExpandResult<V>): ExpandResult<V> => {
	const openPaths = inp.paths.filter(pathOpen)
	const closedPaths = inp.paths.filter(pathClosed)
	if (openPaths.length == 0) {
		return inp;
	}
	const newPaths = openPaths.map<V[]>(closePath)
	return {
		paths: [...newPaths, ...closedPaths],
		skipped: inp.skipped
	}
}

const vectorSortWeight = (vec: VectorV): number => vec.id + (isCrossingVector(vec) ? 10000 : 0) + (isDuplicatedVector(vec) ? 11000 : 0)

/**
 * To build a path properly, we have to pick up vectors in proper order, so we sort them:
 * 1) first crossing vectors that have a duplicate (E1M1_S72 - 300, 298, 302, 301). 2) duplicated vectors. 3) remaining
 */
const sortForExpand = <V extends VectorV>(candidates: V[]): V[] => R.sort(
	(v1, v2) => vectorSortWeight(v2) - vectorSortWeight(v1), candidates)

const sortBySize = <V extends VectorV>(candidates: V[][]): V[][] => R.sort(
	(v1, v2) => v2.length - v1.length, candidates)

/**
 * 	Vectors are sorted in a way that duplicated vectors are on the top. Each path should start from a duplicated vector,
 * 	meaning that one duplicated vector will be removed from the top of the list, and the second remains there.
 * 	Now, when beginning another new path, this remaining duplicated vector is still on the top.
 * 	However, it's also possible that there are more duplicated vectors that we did not use yen - meaning there are
 * 	still duplicated pairs, like:
 * 	<code>[id:518, duplicated_falg:true, id:520, duplicated_falg:true,id:520, duplicated_falg:true,....]</code>
 * 	In such a case, we have to start a new path from a duplicated vector that has yet to be used,
 * 	and this is the one having a sibling.
 */
const nextForNewPath = (vec: VectorV[]): number => {

	const idx = vec.findIndex((el, idx, all) => {
		return idx + 1 < vec.length && el.id == vec[idx + 1].id && isDuplicatedVector(el) && isDuplicatedVector(vec[idx + 1]);
	})
	return idx > 0 ? idx : 0;
}

/** #paths contains array of paths: [[path1],[path2],...,[pathX]] */
const expandPaths = <V extends VectorV>(candidates: V[], existingPaths: V[][] = [], bidirectional = false): ExpandResult<V> => {
	const remaining = sortForExpand(candidates) // we will remove elements one by one from this list and add them to #paths
	let paths = [...existingPaths]
	let skipped = [];
	let appended = paths.length > 0

	// go until all elements in #remaining has been moved to #paths
	while (remaining.length > 0) {

		// none of #remaining could be connected to already existing paths, so start a new path
		if (!appended) {
			paths.push([remaining.splice(nextForNewPath(remaining), 1)[0]])
		}
		appended = false

		for (let remIdx = 0; !appended && remIdx < remaining.length; remIdx++) {
			insertIntoPaths(paths, remaining[remIdx], true, bidirectional).exec(np => {
				paths = np;
				// remove vector from #remaining as we have appended it to current path
				remaining.splice(remIdx, 1)
				appended = true;
			})
		}
	}

	// move all paths with a single vector into skipped, otherwise, we could break a single path into few
	skipped = R.flatten([skipped, paths.filter(p => p.length == 1)])
	paths = paths.filter(p => p.length > 1)
	return {paths, skipped};
}

/** #paths contains array of paths: [[path1],[path2],...,[pathX]] */
const insertIntoPaths = <V extends VectorV>(paths: V[][], candidate: V, connectCrossing = false, bidirectional = true): Either<V[][]> => {
	let inserted = Either.ofLeft<V[][]>(() => 'Candidate not appended');

	// go over paths and try finding one where we can append candidate
	R.addIndex<V[]>(R.find)((path, pathIdx) => {
		// inserting #candidate into the path will return a new path
		inserted = insertIntoPath(path)(candidate, connectCrossing, bidirectional)

			// insert into #paths the new extended path
			.map(foundPath => R.update(pathIdx, foundPath, paths))
		return inserted.isRight()
	})(paths)

	return inserted;
}

/**
 * Tries to insert given #candidate into #path only if it's not fully built.
 * It will not directly connect two crossing vectors unless #connectCrossing is true
 */
const insertIntoPath = <V extends VectorV>(path: V[]) => (candidate: V, connectCrossing = false, bidirectional = true): Either<V[]> =>
	Either.ofConditionFlat(
		// do not alter already closed path
		() => pathNotContinuos(path), () => 'Path already closed.',

		// try inserting into path from left and eventually on the right
		() => appendToPath(path)(candidate, connectCrossing)
			.orAnother(() => bidirectional ? prependToPath(path)(candidate, connectCrossing) : Either.ofLeft(() => 'Prepend disabled')))

/**
 * Tries to insert given #candidate at the beginning #path.
 * Inserted element will be eventually flipped.
 * It will not directly connect two crossing vectors unless #connectCrossing is true
 */
const prependToPath = <V extends VectorV>(path: V[]) => (candidate: V, connectCrossing = false): Either<V[]> => {
	const pathEl = path[0]
	const connection = MF.vectorsConnected(candidate, pathEl)
	return R.cond([
		[() => !connectCrossing && areCrossing(candidate, pathEl), () => Either.ofLeft<V[]>(() => 'Crossing vectors.')],
		[() => MF.vectorsEqual(candidate, pathEl), () => Either.ofLeft<V[]>(() => 'Equal vectors')],
		[(con) => con === VectorConnection.NONE, () => Either.ofLeft<V[]>(() => 'Vector does not connect with path start.')],
		[(con) => ((con === VectorConnection.V1START_TO_V2END || con === VectorConnection.V1END_TO_V2END)),
			() => Either.ofLeft<V[]>(() => 'Vector should be appended.')],
		[(con) => con === VectorConnection.V1END_TO_V2START, () => Either.ofRight([candidate].concat(path))],
		[(con) => con === VectorConnection.V1START_TO_V2START, () => Either.ofRight([MF.reverseVector(candidate)].concat(path))],
		[R.T, () => Either.ofLeft<V[]>(() => 'Unsupported connection: [' + connection + '] to prepend: ' + MF.stringifyVector(candidate) + ' to ' + MF.stringifyVectors(path), LeftType.WARN)]
	])(connection)
}

/**
 * Tries to insert given #candidate on the end of the #path.
 * Inserted element will be eventually flipped.
 * It will not directly connect two crossing vectors unless #connectCrossing is true
 */
const appendToPath = <V extends VectorV>(path: V[]) => (candidate: V, connectCrossing = false): Either<V[]> => {
	const pathEl = path[path.length - 1]
	const connection = MF.vectorsConnected(pathEl, candidate)
	return R.cond([
		[() => !connectCrossing && areCrossing(candidate, pathEl), () => Either.ofLeft<V[]>(() => 'Crossing vectors.')],
		[() => MF.vectorsEqual(candidate, pathEl), () => Either.ofLeft<V[]>(() => 'Equal vectors')],
		[(con) => con === VectorConnection.NONE, () => Either.ofLeft<V[]>(() => 'Vector does not connect with path end.')],
		[(con) => ((con === VectorConnection.V1START_TO_V2END || con === VectorConnection.V1START_TO_V2START)),
			() => Either.ofLeft<V[]>(() => 'Vector should be prepended.')],
		[(con) => con === VectorConnection.V1END_TO_V2START, () => Either.ofRight(path.concat(candidate))],
		[(con) => con === VectorConnection.V1END_TO_V2END, () => Either.ofRight(path.concat(MF.reverseVector(candidate)))],
		[R.T, () => Either.ofLeft<V[]>(() => 'Unsupported connection: [' + connection + '] to append: ' + MF.stringifyVector(candidate) + ' to ' + MF.stringifyVectors(path), LeftType.WARN)]
	])(connection)
}

/**
 * @param paths paths[0] - outer path surrounding remaining paths in #paths[1...x]
 */
const groupByOuterPath = (paths: VectorV[][]): number => {
	const maxVertex = paths.map(path => createMaxVertex(path))
	let maxX = maxVertex[0].x
	let foundIdx = 0
	for (let i = 1; i < maxVertex.length; i++) {
		const x = maxVertex[i].x
		if (x > maxX) {
			foundIdx = i
			maxX = x
		}
	}
	return foundIdx
}

const findMaxVectorVBy = (path: VectorV[]) => (maxFn: (a: VectorV) => number): VectorV =>
	R.reduce(R.maxBy<VectorV>(maxFn), MIN_VECTOR_V, path)

const createMaxVertex = (path: VectorV[]): Vertex => {
	const maxFinder = findMaxVectorVBy(path)

	const maxStartX = maxFinder(v => v.start.x).start.x
	const maxEndX = maxFinder(v => v.end.x).end.x

	const maxStartY = maxFinder(v => v.start.y).start.y
	const maxEndY = maxFinder(v => v.end.y).end.y

	return {x: Math.max(maxStartX, maxEndX), y: Math.max(maxStartY, maxEndY)}
}

const sortByHoles = <V extends VectorV>(paths: V[][]): V[][] => {
	const res = [...paths]
	// find outer shape and shift it on the beginning
	const first = res.splice(groupByOuterPath(paths), 1)[0]
	res.unshift(first)
	return res;
}

const createFlat = (sector: Sector) => (lindedefs: Linedef[]): Either<Flat> =>
	buildPaths(sector.id, lindedefs).map(paths => buildFlat(sector, paths))

/**
 * Two scenarios are supported where there are multiple shapes within one sector:
 * 1) few crossing shapes,
 * 2) one large shape with holes.
 */
const buildFlat = (sector: Sector, paths: Linedef[][]): Flat =>
	R.cond<Linedef[][][], Flat>([
		// only one shape in #paths
		[(p) => p.length == 1, (p) => ({sector, walls: p[0], type: FlatType.AREA}) as FlatArea],

		// multiple crossings shapes in #paths
		[(p) => hasCrossing(p), (p) => ({
			sector,
			walls: p,
			type: FlatType.SHAPES
		}) as FlatWithShapes],

		// one large shape with a few holes
		[R.T, (p) => {
			const sorted = sortByHoles(p);
			return {sector, walls: sorted.shift(), holes: sorted} as FlatWithHoles;
		}]
	])(paths)

const hasCrossingVector = (vectors: VectorV[]) => vectors.findIndex(isCrossingVector) >= 0
const hasCrossing = (paths: VectorV[][]) => paths.length > 0 && (hasCrossingVector(paths[0]) || hasCrossingVector(paths.flat()))

/** Closed path where last element connect to first one, might be not continuos. */
const pathClosed = (vectors: VectorV[]): boolean =>
	vectors.length > 2 && MF.vectorsConnected(vectors[0], vectors[vectors.length - 1]) !== VectorConnection.NONE

const pathOpen = (vectors: VectorV[]) => {
	const res = !pathClosed(vectors)
	return res
}

const closeOpened = (paths: VectorV[][]): VectorV[][] => paths.map(R.when(pathOpen, closePath))

const closePath = <V extends VectorV>(path: V[]): V[] => path.concat(<V>{
	id: -1,
	start: path[path.length - 1].end,
	end: path[0].start
})

const pathsContinuos = (paths: VectorV[][]): boolean =>
	paths.filter(pathContinuos).length === paths.length

/** Continuos and closed path. */
const pathContinuos = (path: VectorV[]): boolean => {

	// #nextRoll will ensure that we compare last element with first one once iterator gets to the end of the path
	const nextRoll = U.nextRoll(path)

	// path needs at least 3 elements
	return path.length > 2 &&

		// optimization - do not iterate over whole path, when start does not connect to an end
		pathClosed(path) &&

		// compare each element in list with next one to ensure that siblings are connected
		path.every((el, idx) =>
			MF.vertexNear(el.end, nextRoll(idx + 1).start))
}

const pathNotContinuos = (path: VectorV[]): boolean => !pathContinuos(path)

const crossingVertexes = (vectors: VectorV[]): Vertex[] => {
	// remove duplicated vectors, otherwise they will count towards crossings
	const uv = MF.uniqueVector(vectors)
	const counter = MF.countVertex(uv)

	// Vectors are crossing when at least 3 vectors share a common point.
	return MF.uniqueVertex(uv).filter(v => counter(v) > 2)
}

const markCrossingVectors = (vectors: VectorV[]): void => {
	Either.ofFunction<VectorV[], Vertex[]>(
		crossingVertexes,
		v => v.length > 0, () => () => 'No crossings'
	)(vectors) // V[] => Vertex[] (crossing vectors)
		.exec(cvs => cvs.forEach(cv =>
			groupByVertex(vectors)(cv).exec(gr => gr[0].forEach(setCrossing))))
}

const markDuplicatedVectors = (vectors: VectorV[]): void => {
	duplicatedIds(vectors).exec(did => {
		vectors.filter(v => did.find(dup => dup == v.id)).forEach(setDuplicated)
	})
}

const filterSectorSplitters = <V extends VectorV>(vectors: V[]): V[] => {
	// find common points (vertex) for crossing vectors
	const crossingVertex = MF.uniqueVertex(vectors).filter(v => MF.countVertex(vectors)(v) > 2)

	// Now we have shared points (Vertex) for all crossing vectors. If a particular vector has both ends in this list
	// and it's an action, it means that this vector splits the sector into two parts and should be removed.
	return vectors.filter(MF.hasNoAction).filter(MF.hasNoVector(crossingVertex))
}

const firstVectorByVertex = (vectors: VectorV[]) => (vertex: Vertex): Either<number> => {
	const idx = vectors.findIndex(MF.hasVertex(vertex))
	return Either.ofCondition(() => idx >= 0, () => 'No Vector for:' + JSON.stringify(vertex), () => idx)
}

/** V[0] - vectors containing given vertex, V[1] - remaining vectors. */
const groupByVertex = <V extends VectorV>(vectors: V[]) => (vertex: Vertex): Either<V[][]> => {
	const remaining = vectors.filter(v => !MF.hasVertex(vertex)(v), vectors)
	const found = vectors.filter(MF.hasVertex(vertex), vectors)
	return Either.ofCondition(
		() => found.length > 0,
		() => 'Vertex: ' + MF.stringifyVertex(vertex) + ' not found in: ' + MF.stringifyVectors(vectors),
		() => [found, remaining])
}

const firstCrossingDuplicatePos = (vectors: VectorV[]): Either<number> =>
	Either.ofFunction<VectorV[], VectorV[]>(vv => vv.filter(isDuplicatedVector).filter(isCrossingVector),
		vv => vv.length > 0, () => () => 'No crossing duplicates')(vectors)

		// we found a crossing and duplicated vector, now we have to get it's position in #vectors
		.map(v => v[0]).map(dc => vectors.indexOf(dc))

const duplicatedIds = (vectors: VectorV[]): Either<number[]> => Either.ofFunction<VectorV[], number[]>(
	// @ts-ignore
	vv => R.pipe(R.groupBy(v => v.id.toString()), R.filter(arr => R.values(arr).length > 1), R.keys, R.uniq, R.map(Number))(vv),

	r => r.length > 0,
	() => () => 'No duplicates')(vectors)

const firstNotCrossingPos = (vectors: VectorV[]): Either<number> =>
	Either.ofFunction<VectorV[], number>(
		vv => vv.findIndex(isNotCrossingVector),
		idx => idx !== -1,
		() => () => 'No crossing vectors')(vectors)

const firstDuplicatePos = (vectors: VectorV[], from = 0): Either<number> => {
	const eq = R.curry(MF.vectorsEqual)
	return Either.ofFunction<VectorV[], number>(
		(vv) => vv.findIndex((el, idx, all) =>
			idx >= from && isDuplicatedVector(el)
		),
		(idx) => idx !== -1,
		() => () => 'Duplicate not found')(vectors)
}


// ############################ EXPORTS ############################
export const testFunctions = {
	insertIntoPath,
	insertIntoPaths,
	prependToPath,
	appendToPath,
	expandPaths,
	sortByHoles,
	groupByOuterPath,
	buildPaths,
	createMaxVertex,
	closeOpened,
	pathContinuos,
	firstVectorByVertex,
	groupByVertex,
	pathClosed,
	filterSectorSplitters,
	pathsContinuos,
	closePath,
	pathOpen,
	firstDuplicatePos,
	pathNotContinuos,
	firstNotCrossingPos,
	markCrossingVectors,
	markDuplicatedVectors,
	crossingVertexes,
	duplicatedIds,
	firstCrossingDuplicatePos,
	isCrossingVector,
	areCrossing,
	isNotCrossingVector,
	cleanCrossingVectors,
	cleanFlags,
	isDuplicatedVector,
	isNotDuplicatedVector,
	setCrossing,
	vectorSortWeight,
	setDuplicated,
	sortForExpand
}

export const functions = {createFlat}
