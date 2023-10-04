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

import {Injectable} from '@angular/core'
import {UploadResult, UploadStatus} from './wad-upload/wad-upload-model'
import {Wad, WadEntry} from './parser/wad-model'
import * as R from 'ramda'
import {Either} from '../common/either'
import {functions as wp} from './parser/wad-parser'
import {EmitEvent, NgRxEventBusService} from '@maciejmiklas/ngrx-event-bus'
import {Log} from '../common/log'
import {WadEvent} from './wad-event'

const CMP = "WadStorageService"

@Injectable({
	providedIn: 'root'
})
export class WadStorageService {
	static CMP = 'WadStorageService'
	private wads: WadEntry[] = []
	private currentWad = 0

	constructor(private eventBus: NgRxEventBusService) {
	}

	public async uploadWad(file: File): Promise<UploadResult> {
		return this.uploadWadIntern(file).then(res => {
			this.eventBus.emit(new EmitEvent(WadEvent.WAD_UPLOADED, res))
			return res
		})
	}

	private async uploadWadIntern(file: File): Promise<UploadResult> {
		if (!file.name.toLocaleLowerCase().endsWith('.wad')) {
			return {fileName: file.name, status: UploadStatus.UNSUPPORTED_TYPE, message: undefined}
		}
		if (R.find(R.propEq('name', file.name))(this.wads) !== undefined) {
			return {fileName: file.name, status: UploadStatus.FILE_ALREADY_EXISTS, message: undefined}
		}
		return file.arrayBuffer().then(ab => {
			return this.load(ab).mapGet<UploadResult, UploadResult>(message => {
					return {fileName: file.name, status: UploadStatus.PARSE_ERROR, message: message()}
				},
				wad => {
					this.wads.push({wad, name: file.name, gameSave: []})
					this.currentWad = this.wads.length - 1
					return {fileName: file.name, status: UploadStatus.UPLOADED, message: undefined}
				})
		})
	}

	public isLoaded(): boolean {
		return this.wads.length > 0
	}

	public removeAllWads(): void {
		this.wads = []
		this.currentWad = 0
	}

	public setCurrentWad(idx: number): boolean {
		if (idx >= this.wads.length) {
			Log.warn(WadStorageService.CMP, 'Cannot set current wad to: %1 > %2', idx, this.wads.length)
			return false
		}
		this.currentWad = idx
		return true
	}

	public getCurrent(): Either<WadEntry> {
		return Either.ofCondition(() => this.isLoaded(), () => 'No WADs', () => this.wads[this.currentWad])
	}

	private load(wadBuf: ArrayBuffer): Either<Wad> {
		const bytes = Either.ofRight(Array.from(new Uint8Array(wadBuf))).get()
		const startTime = performance.now()
		const wad = wp.parseWad(bytes)
		Log.info(CMP, 'WAD parsed in ', performance.now() - startTime, ' ms')
		return wad
	}
}



