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
import {Injectable} from '@angular/core';
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
		this.uploadTestingWAD();
	}

	uploadTestingWAD(): void {
		// @ts-ignore
		const file = new File([new Uint8Array(U.base64ToUint8NumberArray(wadJson.doom))], 'doom.wad', {type: 'mimeType'})
		this.wadStorage.uploadWad(file);
	}
}
