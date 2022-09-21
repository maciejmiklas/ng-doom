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
import {getAllDirs, getFlats, getE1M1Linedefs, getTextures, getWadBytes} from "./testdata/data";

describe('test', () => {
	it('ABC', () => {
		const maps = mp.parseMaps(getWadBytes(), getAllDirs(), getTextures(), getFlats());
		const m1e4 = maps.get()[3];
		const backs = tf.findBackLinedefs(m1e4.linedefs)

		const finder = tf.findBacksidesBySector(backs);
		let cnt = 0;
		backs.forEach(ld => {
			if (ld.sector.id == 50) {
				console.log('>F>')
			}

			ld.backSide.map(bs => {
				if (bs.sector.id == 50) {
					//console.log('>B>')
					cnt++;
				}
			})

		})
		console.log('>>B>>', cnt);
	});
});
