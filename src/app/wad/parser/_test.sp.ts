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
import {testFunctions as tf} from "./map-parser";
import {getLinedefs, getSectors} from "./testdata/data";
import {LinedefBySector} from "./wad-model";

describe('map-parser#buildPaths', () => {
	it('E1M1 - Sector 74', () => {
		const finder = tf.findBacksidesBySector(getLinedefs())
		const lbs: LinedefBySector[] = tf.groupBySector(getLinedefs(), getSectors());
		const s74 = lbs.find(ld => ld.sector.id == 74);
		const ld = s74.linedefs.concat(finder(35).get())
		const sorted = tf.buildPaths(tf.orderPath(ld));
		expect(sorted.length).toEqual(1);
	});
});
