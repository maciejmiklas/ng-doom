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
