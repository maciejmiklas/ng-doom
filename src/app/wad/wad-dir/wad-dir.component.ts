import {Component, Input, OnInit} from '@angular/core';
import {Directory} from '../parser/wad-model';

@Component({
	selector: '[app-wad-dir]',
	templateUrl: './wad-dir.component.html',
	styleUrls: ['./wad-dir.component.scss']
})
export class WadDirComponent implements OnInit {

	@Input()
	dir: Directory;

	@Input()
	rowClass = ''

	constructor() {
	}

	ngOnInit(): void {
	}

}
