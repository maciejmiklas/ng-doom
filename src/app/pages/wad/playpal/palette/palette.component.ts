import {Component, Input, OnInit} from '@angular/core';
import {Palette} from '../../../../wad/wad_model';

@Component({
	selector: 'app-palette',
	templateUrl: './palette.component.html',
	styleUrls: ['./palette.component.css']
})
export class PaletteComponent implements OnInit {

	@Input()
	palette: Palette;

	constructor() {
	}

	ngOnInit(): void {
	}

}
