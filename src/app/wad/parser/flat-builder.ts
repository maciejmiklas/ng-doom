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
import {Either} from '../../common/either'
import {functions as mf, VectorConnection, VectorV} from './wad-model'
import {Log} from "../../common/log";

const CMP = 'FL-BI'

/**
 * Shapes can have common ages. To close such forms properly, they require special treatment. We will separate all
 * vectors into two groups: crossing vectors (having a common point) and remaining. The problem is to figure out to
 * which shape the crossing vectors belong so that we do not connect shapes meant to be separated. A path building
 * will be spread into three phases to solve that problem:
 * 1)create paths from remaining vectors without crossings. That will make some open paths; a few might be closed if
 *   they do not need a vector from crossings to build a closed shape.
 * 2)Add crossing vectors to already existing paths, BUT ensure that vectors from crossings do not connect directly.
 *   It would result in a path between two shapes. To achieve that, we will add to existing paths vectors from crossing,
 *   one by one, but we will connect those to that path side, which does not contain already vector from crossing.
 * 3)If there are still some unconnected vectors in the crossing collection, add them to existing paths whenever
 *   they would fit.
 */
const buildPaths = <V extends VectorV>(vectors: V[]): V[][] => {
	const grouped = mf.groupCrossingVectors(vectors)
	if (grouped.isRight()) {
		const cv = grouped.get();

		// 1) create paths from remaining vectors without crossings
		const p1res = expandPaths(cv.remaining, [])

		// 2)Add crossing vectors to already existing pathsf
		const p2res = expandPaths(cv.crossing.flat(), p1res.paths)

		let paths = p2res.paths;
		if (p2res.skipped.length > 0) {
			const p3res = expandPaths(p2res.skipped, p2res.paths, true)
			paths = p3res.paths
			if (p3res.skipped.length > 0) {
				// @ts-ignore
				Log.warn(CMP, 'Unexpected elements in skipped on buildPaths', mf.stringifyVector(p3res.skipped))
			}
		}
		return paths;
	} else {
		return expandPaths(vectors, []).paths
	}
}

type ExpandResult<V extends VectorV> = {
	paths: V[][],
	skipped: V[]
}

/** #paths contains array of paths: [[path1],[path2],...,[pathX]] */
const expandPaths = <V extends VectorV>(vectors: V[], existingPaths: V[][], ignoreCrossing = false): ExpandResult<V> => {
	// we will remove elements one by one from this list and add them to #paths
	const remaining = [...vectors]
	let paths = [...existingPaths]
	const skipped = [];
	let appended = paths.length > 0

	// go until all elements in #remaining has been moved to #paths
	while (remaining.length > 0) {

		// none of #remaining could be connected to already existing paths, so start a new path
		if (!appended) {
			const next = remaining.pop();

			// never start a new path with a crossing vector. Always try to add crossing into existing routes
			if (mf.isCrossing(next)) {
				skipped.push(next)
			} else {
				paths.push([next])
			}
		}
		appended = false

		for (let remIdx = 0; !appended && remIdx < remaining.length; remIdx++) {
			expandPath(paths, remaining[remIdx], ignoreCrossing).exec(np => {
				paths = np;
				// remove vector from #remaining as we have appended it to current path
				remaining.splice(remIdx, 1)
				appended = true;
			})
		}
	}
	return {paths, skipped};
}

/** #paths contains array of paths: [[path1],[path2],...,[pathX]] */
const expandPath = <V extends VectorV>(paths: V[][], candidate: V, ignoreCrossing = false): Either<V[][]> => {
	let found = Either.ofLeft<V[][]>(() => 'Candidate not appended');

	// go over paths and try finding one where we can append candidate
	R.addIndex<V[]>(R.find)((path, pathIdx) => {
		// inserting #candidate into the path will return a new path
		found = insertIntoPath(path)(candidate, ignoreCrossing)

			// insert into #paths the new extended path
			.map(foundPath => R.update(pathIdx, foundPath, paths))
		return found.isRight()
	})(paths)
	return found;
}

/**
 * Tries to insert given #candidate into #path only if it's not fully built.
 * It will not directly connect two crossing vectors unless #ignoreCrossing is true
 */
const insertIntoPath = <V extends VectorV>(path: V[]) => (candidate: V, ignoreCrossing = false): Either<V[]> =>
	Either.ofConditionFlat(
		// do not alter already closed path
		() => !mf.pathContinuos(path), () => 'Path already closed.',

		// try inserting into path from left and eventually on the right
		() => prependToPath(path)(candidate, ignoreCrossing).orAnother(() => appendToPath(path)(candidate, ignoreCrossing)))

/**
 * Tries to insert given #candidate at the beginning #path.
 * Inserted element will be eventually flipped.
 * It will not directly connect two crossing vectors unless #ignoreCrossing is true
 */
const prependToPath = <V extends VectorV>(path: V[]) => (candidate: V, ignoreCrossing = false): Either<V[]> => {
	const element = path[0]
	const connection = mf.vectorsConnected(candidate, element)
	return R.cond([
		[() => ignoreCrossing && mf.areCrossing(candidate, element), () => Either.ofLeft<V[]>(() => 'Crossing vectors.')],
		[() => mf.vectorsEqual(candidate, element), () => Either.ofLeft<V[]>(() => 'Equal vectors')],
		[(con) => con === VectorConnection.NONE, () => Either.ofLeft<V[]>(() => 'Vector does not connect with path start.')],
		[(con) => ((con === VectorConnection.V1START_TO_V2END || con === VectorConnection.V1END_TO_V2END) && path.length == 1),
			() => Either.ofLeft<V[]>(() => 'Vector should be appended.')],
		[(con) => con === VectorConnection.V1END_TO_V2START, () => Either.ofRight([candidate].concat(path))],
		[(con) => con === VectorConnection.V1START_TO_V2START, () => Either.ofRight([mf.reverseVector(candidate)].concat(path))],
		[R.T, () => Either.ofWarn<V[]>(() => 'Unsupported connection: [' + connection + '] to prepend: ' + mf.stringifyVector(candidate) + ' to ' + mf.stringifyVectors(path))]
	])(connection)
}

/**
 * Tries to insert given #candidate on the end of the #path.
 * Inserted element will be eventually flipped.
 * It will not directly connect two crossing vectors unless #ignoreCrossing is true
 */
const appendToPath = <V extends VectorV>(path: V[]) => (candidate: V, ignoreCrossing = false): Either<V[]> => {
	const element = path[path.length - 1]
	const connection = mf.vectorsConnected(element, candidate)
	return R.cond([
		[() => ignoreCrossing && mf.areCrossing(candidate, element), () => Either.ofLeft<V[]>(() => 'Crossing vectors.')],
		[() => mf.vectorsEqual(candidate, element), () => Either.ofLeft<V[]>(() => 'Equal vectors')],
		[(con) => con === VectorConnection.NONE, () => Either.ofLeft<V[]>(() => 'Vector does not connect with path end.')],
		[(con) => ((con === VectorConnection.V1START_TO_V2END || con === VectorConnection.V1END_TO_V2END) && path.length == 1),
			() => Either.ofLeft<V[]>(() => 'Vector should be prepended.')],
		[(con) => con === VectorConnection.V1END_TO_V2START, () => Either.ofRight(path.concat(candidate))],
		[(con) => con === VectorConnection.V1END_TO_V2END, () => Either.ofRight(path.concat(mf.reverseVector(candidate)))],
		[R.T, () => Either.ofWarn<V[]>(() => 'Unsupported connection: [' + connection + '] to append: ' + mf.stringifyVector(candidate) + ' to ' + mf.stringifyVectors(path))]
	])(connection)
}
/** #paths contains array of paths: [[path1],[path2],...,[pathX]] */
const expandPaths_ = <V extends VectorV>(vectors: V[], existingPaths: V[][]): V[][] => {

	// we will remove elements one by one from this list and add them to #paths
	const remaining = [...vectors]
	const paths = [...existingPaths]
	let appended = paths.length > 0

	// go until all elements in #remaining has been moved to #paths
	while (remaining.length > 0) {

		// none of #remaining could be connected to already existing paths, so start a new path
		if (!appended) {
			paths.push([remaining.pop()])
		}

		appended = false
		// go over each path in #paths and try to append to this path vector from #remaining
		for (let pathIdx = 0; pathIdx < paths.length; pathIdx++) {
			const path = paths[pathIdx];
			if (mf.pathContinuos(path)) {
				continue;
			}
			const pathBuilder = insertIntoPath(path)

			// go over all #remaining (not used) vectors and test whether we can append it to current path
			for (let remIdx = 0; !appended && remIdx < remaining.length; remIdx++) {
				pathBuilder(remaining[remIdx]).exec(alteredPath => {
					appended = true
					paths[pathIdx] = alteredPath

					// remove vector from #remaining as we have appended it to current path
					remaining.splice(remIdx, 1)
				})
			}
		}
	}
	return paths
}
// ############################ EXPORTS ############################
export const testFunctions = {
	insertIntoPath,
	prependToPath,
	appendToPath,
	expandPath
}

export const functions = {buildPaths}
