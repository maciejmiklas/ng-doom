import {Injectable} from '@angular/core';
import {Either} from '@maciejmiklas/functional-ts';
import U from './common/util';

import wadJson from './wad/parser/testdata/doom.json';
import {WadStorageService} from './wad/wad-storage.service';

@Injectable({
	providedIn: 'root'
})
export class AppSetupService {

	constructor(private wadStorage: WadStorageService) {
	}

	setup(): void {
		Either.enableLog(false);
		this.uploadTestingWAD();
	}

	uploadTestingWAD(): void {
		// @ts-ignore
		const file = new File([new Uint8Array(U.base64ToUint8Array(wadJson.doom))], 'doom.wad', {type: 'mimeType'})
		this.wadStorage.uploadWad(file);
	}
}
