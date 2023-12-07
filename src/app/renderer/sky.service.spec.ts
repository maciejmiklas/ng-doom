/*
 * Copyright 2022 Maciej Miklas (MIT License)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import {TestBed} from '@angular/core/testing'

import {SkyService, testFunctions as tf} from './sky.service'

describe('SkyService', () => {
	let service: SkyService

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(SkyService)
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})
})


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
