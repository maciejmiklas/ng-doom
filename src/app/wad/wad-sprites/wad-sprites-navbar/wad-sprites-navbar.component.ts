import {Component} from '@angular/core';
import {NavbarPlugin} from '../../../main/service/navbar_plugin';
import {SpritesListControl} from '../wad-sprites.component';

@Component({
	selector: 'app-wad-sprites-navbar',
	templateUrl: './wad-sprites-navbar.component.html',
	styleUrls: ['./wad-sprites-navbar.component.css']
})
export class WadSpritesNavbarComponent implements NavbarPlugin<SpritesListControl> {

	private spritesListControl: SpritesListControl;

	constructor() {
	}

	ngOnInit(): void {

	}

	setData(data: SpritesListControl): void {
		this.spritesListControl = data;
	}

	set filter(val: string) {
		this.spritesListControl.applyFilter(val);
	}

	get filter(): string {
		return '';
	}

}
