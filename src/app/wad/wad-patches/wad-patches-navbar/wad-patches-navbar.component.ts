import {Component} from '@angular/core';
import {NavbarPlugin} from '../../../main/service/navbar_plugin';
import {PatchesListControl} from '../wad-patches.component';

@Component({
	selector: 'app-wad-patches-navbar',
	templateUrl: './wad-patches-navbar.component.html',
	styleUrls: ['./wad-patches-navbar.component.css']
})
export class WadPatchesNavbarComponent implements NavbarPlugin<PatchesListControl> {

	private data: PatchesListControl;

	constructor() {
	}

	setData(data: PatchesListControl): void {
		this.data = data;
	}


	set filter(val: string) {
		this.data.applyFilter(val);
	}

	get filter(): string {
		return '';
	}
}
