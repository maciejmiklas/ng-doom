import {Component, Input, OnInit} from '@angular/core';
import {Directory} from '../../parser/wad_model';

@Component({
	selector: 'app-wad-dir',
	templateUrl: './wad-dir.component.html',
	styleUrls: ['./wad-dir.component.css']
})
export class WadDirComponent implements OnInit {

	@Input()
	dir: Directory;

	constructor() {
	}

	ngOnInit(): void {
	}

}
