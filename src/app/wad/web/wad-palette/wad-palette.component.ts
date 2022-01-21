import {Component, Input, OnInit} from '@angular/core';
import * as R from 'ramda';
import {Palette, RGB} from '../../parser/wad-model';

@Component({
	selector: 'app-wad-palette',
	templateUrl: './wad-palette.component.html',
	styleUrls: ['./wad-palette.component.scss']
})
export class WadPaletteComponent implements OnInit {

	@Input()
	palette: Palette;

	/** 16 rows, each containing 16xRGB */
	rows: RGB[][];

	ngOnInit(): void {
		this.rows = R.splitEvery(16, this.palette.colors);
	}

}
