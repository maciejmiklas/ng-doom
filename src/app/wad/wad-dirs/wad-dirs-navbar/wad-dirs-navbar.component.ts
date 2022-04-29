import {Component} from '@angular/core';
import {DirsListControl} from '../wad-dirs.component';
import {NavbarPlugin} from '../../../main/service/navbar_plugin';

@Component({
	selector: 'app-wad-dirs-wad-map-navbar',
	templateUrl: './wad-dirs-navbar.component.html',
	styleUrls: ['./wad-dirs-navbar.component.scss']
})
export class WadDirsNavbarComponent implements NavbarPlugin<DirsListControl> {
	maxSize = 10;

	private dirsListControl: DirsListControl;

	constructor() {
	}

	setData(dirsListControl: DirsListControl): void {
		this.dirsListControl = dirsListControl;
	}

	set filter(val: string) {
		this.dirsListControl.applyFilter(val);
	}

	get filter(): string {
		return '';
	}

}
