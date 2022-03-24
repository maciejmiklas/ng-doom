import {Component, Input} from '@angular/core';

@Component({
	selector: 'app-wad-dir-element',
	templateUrl: './wad-dir-element.component.html',
	styleUrls: ['./wad-dir-element.component.scss']
})
export class WadDirElementComponent {

	@Input()
	label: string;

	@Input()
	value: string;


}
