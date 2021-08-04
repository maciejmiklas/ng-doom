import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {CurrentWadService} from '../../service/current-wad.service';
import {FileSystemFileEntry, NgxFileDropEntry} from 'ngx-file-drop';
import {UploadInfo, UploadStatus} from './upload-model';

@Component({
	selector: 'app-wad-upload',
	templateUrl: './wad-upload.component.html',
	styleUrls: ['./wad-upload.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class WadUploadComponent implements OnInit {

	files: NgxFileDropEntry[] = [];
	uploadInfo: UploadInfo[] = [];
	uploading = false;

	constructor(private currentWadService: CurrentWadService) {
	}

	ngOnInit(): void {
	}

	handleUploadWad(event: Event): void {
		const file = (event.target as HTMLInputElement).files[0];
		file.arrayBuffer().then(buf => {
			this.currentWadService.load(Array.from(new Uint8Array(buf)));
		});
	}

	public onFileOver(): void {
		this.uploading = true;
	}

	public onFileLeave(): void {
		this.uploading = false;
	}

	public showUploadStatus(): boolean {
		return !this.uploading && this.uploadInfo.length > 0;
	}

	private getUploadStatus(file: File): UploadStatus {
		if (!file.name.toLocaleLowerCase().endsWith('.wad')) {
			return UploadStatus.UNSUPPORTED_TYPE;
		}
		return UploadStatus.UPLOADED;
	}

	public onFileDrop(files: NgxFileDropEntry[]): void {
		this.files = files;
		this.uploadInfo = [];
		for (const droppedFile of files) {
			if (droppedFile.fileEntry.isFile) {
				const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
				fileEntry.file((file: File) => {
					this.uploadInfo.push({filePath: droppedFile.relativePath, status: this.getUploadStatus(file), file});
				});
			} else {
				this.uploadInfo.push({filePath: droppedFile.relativePath, status: UploadStatus.UNSUPPORTED_TYPE, file: null});
			}
		}
		this.uploading = false;
	}
}
