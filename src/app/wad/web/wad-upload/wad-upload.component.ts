import {Component, OnInit} from '@angular/core';
import {CurrentWadService} from '../../service/current-wad.service';

@Component({
	selector: 'app-wad-upload',
	templateUrl: './wad-upload.component.html'
})
export class WadUploadComponent implements OnInit {


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

}
