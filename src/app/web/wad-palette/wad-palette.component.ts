import {Component, Input, OnInit} from '@angular/core';
import {Palette} from '../../wad/wad_model';

@Component({
	selector: 'app-wad-palette',
	templateUrl: './wad-palette.component.html'
})
export class WadPaletteComponent implements OnInit {

	@Input()
	palette: Palette;

	constructor() {
	}

	ngOnInit(): void {
	}

}
