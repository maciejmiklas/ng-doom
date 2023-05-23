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
import {Component} from '@angular/core'
import { FileSystemFileEntry, NgxFileDropEntry, NgxFileDropModule } from 'ngx-file-drop'
import {WadStorageService} from '../wad-storage.service'
import {UploadResult, UploadStatus} from './wad-upload-model'
import { NgIf, NgFor, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';

@Component({
    selector: 'app-wad-upload',
    templateUrl: './wad-upload.component.html',
    standalone: true,
    imports: [NgxFileDropModule, NgIf, NgFor, NgSwitch, NgSwitchCase, NgSwitchDefault]
})
export class WadUploadComponent {

	files: NgxFileDropEntry[] = []
	uploadResults: UploadResult[] = []
	uploading = false
	statusEnum = UploadStatus

	constructor(private wadStorage: WadStorageService) {
	}

	public onFileOver(): void {
		this.uploading = true
	}

	public onFileLeave(): void {
		this.uploading = false
	}

	public showUploadStatus(): boolean {
		return !this.uploading && this.uploadResults.length > 0
	}

	public onFileDrop(files: NgxFileDropEntry[]): void {
		this.files = files
		this.uploadResults = []
		for (const droppedFile of files) {
			const fileEntry = droppedFile.fileEntry as FileSystemFileEntry
			fileEntry.file((file: File) => {
				this.wadStorage.uploadWad(file).then(res => {
					this.uploadResults.push(res)
				})
			})
		}
		this.uploading = false
	}
}
