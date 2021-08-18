import {Injectable} from '@angular/core';
import {UploadResult, UploadStatus, WadEntry} from './wad-service-model';
import * as R from 'ramda';
import {Either} from '../../common/is/either';
import {functions as wp} from '../parser/wad_parser';
import {Wad} from '../parser/wad_model';
import {EmitEvent, NgRxEventBusService} from 'ngrx-event-bus';
import {Event} from '../../common/is/event';
import {Log} from '../../common/is/log';

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
			this.eventBus.emit(new EmitEvent(Event.WAD_UPLOAD, res));
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
			return this.load(ab).mapGet<UploadResult>(message => {
					return {fileName: file.name, status: UploadStatus.PARSE_ERROR, message};
				},
				wad => {
					this.wads.push({wad, name: file.name, gameSave: []});
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



