import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {CurrentWadService} from '../../service/current-wad.service';
import {FileSystemDirectoryEntry, FileSystemFileEntry, NgxFileDropEntry} from 'ngx-file-drop';

@Component({
	selector: 'app-wad-upload',
	templateUrl: './wad-upload.component.html',
	styleUrls: ['./wad-upload.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class WadUploadComponent implements OnInit {

	public files: NgxFileDropEntry[] = [];

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

	public dropped(files: NgxFileDropEntry[]): void {
		this.files = files;
		for (const droppedFile of files) {

			// Is it a file?
			if (droppedFile.fileEntry.isFile) {
				const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
				fileEntry.file((file: File) => {

					// Here you can access the real file
					console.log('FILE:', droppedFile.relativePath, file);
				});
			} else {
				// It was a directory (empty directories are added, otherwise only files)
				const fileEntry = droppedFile.fileEntry as FileSystemDirectoryEntry;
				console.log('DIR:', droppedFile.relativePath, fileEntry);
			}
		}
	}

}
