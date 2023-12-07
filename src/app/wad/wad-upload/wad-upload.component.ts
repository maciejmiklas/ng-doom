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
import {Component} from '@angular/core'
import {FileSystemFileEntry, NgxFileDropEntry, NgxFileDropModule} from 'ngx-file-drop'
import {WadStorageService} from '../wad-storage.service'
import {UploadResult, UploadStatus} from './wad-upload-model'
import {NgFor, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault} from '@angular/common'

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
