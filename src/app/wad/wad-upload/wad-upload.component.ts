import {Component, ViewEncapsulation} from '@angular/core';
import {FileSystemFileEntry, NgxFileDropEntry} from 'ngx-file-drop';
import {WadStorageService} from '../wad-storage.service';
import {UploadResult, UploadStatus} from './wad-upload-model';

@Component({
	selector: 'app-wad-upload',
	templateUrl: './wad-upload.component.html',
	styleUrls: ['./wad-upload.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class WadUploadComponent {

	files: NgxFileDropEntry[] = [];
	uploadResults: UploadResult[] = [];
	uploading = false;
	statusEnum = UploadStatus;

	constructor(private wadStorage: WadStorageService) {
	}

	public onFileOver(): void {
		this.uploading = true;
	}

	public onFileLeave(): void {
		this.uploading = false;
	}

	public showUploadStatus(): boolean {
		return !this.uploading && this.uploadResults.length > 0;
	}

	public onFileDrop(files: NgxFileDropEntry[]): void {
		this.files = files;
		this.uploadResults = [];
		for (const droppedFile of files) {
			const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
			fileEntry.file((file: File) => {
				this.wadStorage.uploadWad(file).then(res => {
					this.uploadResults.push(res);
				});
			});
		}
		this.uploading = false;
	}
}
