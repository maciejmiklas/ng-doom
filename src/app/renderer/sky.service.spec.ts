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
import {TestBed} from '@angular/core/testing';

import {SkyService, testFunctions as tf} from './sky.service';

describe('SkyService', () => {
	let service: SkyService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(SkyService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});


describe('three-builder#boxPaths', () => {

	it('indigo', () => {
		const paths = tf.boxPaths('indigo', 'png')
		expect(paths.length).toEqual(6)
		expect(paths[0]).toEqual('./assets/sky/indigo/ft.png')
		expect(paths[1]).toEqual('./assets/sky/indigo/bk.png')
		expect(paths[2]).toEqual('./assets/sky/indigo/up.png')
		expect(paths[3]).toEqual('./assets/sky/indigo/dn.png')
		expect(paths[4]).toEqual('./assets/sky/indigo/rt.png')
		expect(paths[5]).toEqual('./assets/sky/indigo/lf.png')
	})

})
