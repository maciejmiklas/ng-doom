/*
 * Copyright 2022 Maciej Miklas
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
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
import {testFunctions as tf, functions as mp} from "./map-parser";
import {
	getAllDirs,
	getFlats,
	getE1M1Linedefs,
	getTextures,
	getWadBytes,
	pathClosedReversedMix,
	pathRectanglesMixedReversed
} from "./testdata/data";

describe('test', () => {
	it('ABC', () => {
		const maps = mp.parseMaps(getWadBytes(), getAllDirs(), getTextures(), getFlats());
		const m1e1 = maps.get()[1];
	});
});


describe('map-parser#buildPaths', () => {

	it('Connected rectangles', () => {
		const sorted = tf.buildPaths(tf.orderPath(pathClosedReversedMix));
	});
});


describe('map-parser#orderPath', () => {

	it('Rectangles mixed and reversed', () => {
		const ordered = tf.orderPath(pathRectanglesMixedReversed);
		console.log(ordered);
	});
});


/*
 - przerobic buildPaths tak zeby dzialal z vektorami reversed
 - dopiero po znalezieniu sciezek zrobic order
 - na poczatku sprawdzam czy sa przynajmniej 3 verktory ze wspolnym punktem, jak tak to mamy rozgalezienie figur
 - bierzemy jakikolwiek z tych wektorow i szukamy nastepnego do kontynuacji, ale to nie moze byc zaden z tych wospolnych z rozgalezienia
 *
 */
