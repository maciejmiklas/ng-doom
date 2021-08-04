import {Injectable} from '@angular/core';
import {UploadResult, WadEntry} from './wad-model';
import {UploadStatus} from '../web/wad-upload/upload-model';
import * as R from 'ramda';
import {Either} from '../../common/is/either';
import {functions as wp} from '../parser/wad_parser';
import {EmitEvent, NgRxEventBusService} from 'ngrx-event-bus';
import {Events} from '../../common/is/Events';
import {Wad} from '../parser/wad_model';

@Injectable({
	providedIn: 'root'
})
export class WadStorageService {

	private wads: WadEntry[] = [];
	private currentWad = 0;

	constructor(private eventBus: NgRxEventBusService) {
	}

	public uploadWad(file: File): UploadResult {
		if (!file.name.toLocaleLowerCase().endsWith('.wad')) {
			return {fileName: file.name, status: UploadStatus.UNSUPPORTED_TYPE};
		}
		if (R.find(R.propEq('name', file.name))(this.wads) !== undefined) {
			return {fileName: file.name, status: UploadStatus.FILE_ALREADY_EXISTS};
		}
		// this.load(file.arrayBuffer())
		const status = {fileName: file.name, status: UploadStatus.UPLOADED};
		this.eventBus.emit(new EmitEvent(Events.WAD_UPLOADED, status));
		return status;
	}

	public load(wadBuf: ArrayLike<number> | ArrayBufferLike): Either<Wad> {
		const bytes = Either.ofRight(Array.from(new Uint8Array(wadBuf))).get();
		return wp.parseWad(bytes);
	}
}



