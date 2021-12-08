import {Component} from '@angular/core';
import {DirsListControl} from '../wad-dirs.component';
import {NavbarPlugin} from '../../../../main/service/navbar_plugin';

@Component({
	selector: 'app-wad-dirs-navbar-plugin',
	templateUrl: './wad-dirs-navbar-plugin.component.html',
	styleUrls: ['./wad-dirs-navbar-plugin.component.scss']
})
export class WadDirsNavbarPluginComponent implements NavbarPlugin<DirsListControl> {
	maxSize = 10;

	private dirsListControl: DirsListControl;

	constructor() {
	}

	setData(dirsListControl: DirsListControl): void {
		this.dirsListControl = dirsListControl;
	}

	set filter(val: string) {
		this.dirsListControl.setFilter(val);
	}

}
