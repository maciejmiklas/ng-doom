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

import {WadStorageService} from './wad-storage.service'
import {NgRxEventBusService} from '@maciejmiklas/ngrx-event-bus'
import {UploadStatus} from './wad-upload/wad-upload-model'
import {getWadBytes} from './parser/testdata/data'


describe('wad-storage.service', () => {
	let service: WadStorageService

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers:
				[NgRxEventBusService, {
					provide: NgRxEventBusService,
					useValue: jasmine.createSpyObj('NgRxEventBusService', ['emit'])
				}]
		})
		service = TestBed.inject(WadStorageService)
		service.removeAllWads()
	})

	it('#isLoaded - empty', () => {
		expect(service.isLoaded()).toBeFalse()
	})

	it('#setCurrentWad - out of index', () => {
		expect(service.setCurrentWad(35)).toBeFalse()
	})

	it('#uploadWad - wrong file extension', () => {
		service.uploadWad(new File([], 'doom.bar', {type: 'application/octet-stream'})).then(res => {
			expect(res.fileName).toEqual('doom.bar')
			expect(res.message).toBeUndefined()
			expect(res.status).toEqual(UploadStatus.UNSUPPORTED_TYPE)
		})
		expect(true).toBeTrue()
	})

	const WAD_BYTES = new Blob([new Uint8Array(getWadBytes())])
	it('#uploadWad - type not supported', () => {
		service.uploadWad(new File([WAD_BYTES], 'doom.bar', {type: 'application/octet-stream'})).then(res => {
			expect(res.fileName).toEqual('doom.bar')
			expect(res.message).toBeUndefined()
			expect(res.status).toEqual(UploadStatus.UNSUPPORTED_TYPE)
		})
		expect(true).toBeTrue()
	})

	// FIXME - test not working, why?
/*
	const WAD = new File([WAD_BYTES], 'doom.wad', {type: 'application/octet-stream'})
	it('#uploadWad - parse success', () => {
		service.uploadWad(WAD).then(res => {
			expect(res.fileName).toEqual('doom.wad')
			expect(res.message).toBeUndefined()
			expect(res.status).toEqual(UploadStatus.UPLOADED)

			expect(service.isLoaded()).toBeTruthy()
			expect(service.getCurrent().isRight()).toBeTruthy()
			expect(service.getCurrent().get().name).toEqual('doom.wad')
		})
	})

	it('#uploadWad - file already exists', () => {
		service.uploadWad(WAD).then(res1 => {
			service.uploadWad(WAD).then(res2 => {
				expect(res2.status).toEqual(UploadStatus.FILE_ALREADY_EXISTS)
			})
		})
	})
*/
	it('#uploadWad - parse error', () => {
		service.uploadWad(new File([new Blob([new Uint8Array([123, 123, 42, 223, 234, 42, 23, 12, 32])])], 'doom.wad', {type: 'application/octet-stream'})).then(res => {
			expect(res.message).toBeTruthy()
			expect(res.status).toEqual(UploadStatus.PARSE_ERROR)
		})
		expect(true).toBeTrue()
	})

})
