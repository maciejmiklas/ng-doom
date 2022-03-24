import {Injectable} from '@angular/core';
import {UploadResult, UploadStatus} from './wad-upload/wad-upload-model';
import {WadEntry} from './parser/wad-model'
import * as R from 'ramda';
import {Either} from '@maciejmiklas/functional-ts';
import {functions as wp} from './parser/wad-parser';
import {Wad} from './parser/wad-model';
import {EmitEvent, NgRxEventBusService} from 'ngrx-event-bus';
import {Log} from '../common/log';
import {WadEvent} from './wad-event';

@Injectable({
	providedIn: 'root'
})
export class WadStorageService {
	static CMP = 'WadStorageService';
	private wads: WadEntry[] = [];
	private currentWad = 0;

	constructor(private eventBus: NgRxEventBusService) {
	}

	public async uploadWad(file: File): Promise<UploadResult> {
		return this.uploadWadIntern(file).then(res => {
			this.eventBus.emit(new EmitEvent(WadEvent.WAD_UPLOADED, res));
			return res;
		});
	}

	private async uploadWadIntern(file: File): Promise<UploadResult> {
		if (!file.name.toLocaleLowerCase().endsWith('.wad')) {
			return {fileName: file.name, status: UploadStatus.UNSUPPORTED_TYPE, message: undefined};
		}
		if (R.find(R.propEq('name', file.name))(this.wads) !== undefined) {
			return {fileName: file.name, status: UploadStatus.FILE_ALREADY_EXISTS, message: undefined};
		}
		return file.arrayBuffer().then(ab => {
			return this.load(ab).mapGet<UploadResult, UploadResult>(message => {
					return {fileName: file.name, status: UploadStatus.PARSE_ERROR, message};
				},
				wad => {
					this.wads.push({wad, name: file.name, gameSave: []});
					this.currentWad = this.wads.length - 1;
					return {fileName: file.name, status: UploadStatus.UPLOADED, message: undefined};
				});
		});
	}

	public isLoaded(): boolean {
		return this.wads.length > 0;
	}

	public removeAllWads(): void {
		this.wads = [];
		this.currentWad = 0;
	}

	public setCurrentWad(idx: number): boolean {
		if (idx >= this.wads.length) {
			Log.warn(WadStorageService.CMP, 'Cannot set current wad to: %1 > %2', idx, this.wads.length);
			return false;
		}
		this.currentWad = idx;
		return true;
	}

	public getCurrent(): Either<WadEntry> {
		return Either.ofCondition(() => this.isLoaded(), () => 'No WADs', () => this.wads[this.currentWad]);
	}

	private load(wadBuf: ArrayBuffer): Either<Wad> {
		const bytes = Either.ofRight(Array.from(new Uint8Array(wadBuf))).get();
		return wp.parseWad(bytes);
	}
}



