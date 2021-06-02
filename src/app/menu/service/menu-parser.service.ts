import {Injectable} from '@angular/core';
import {MenuRoot} from './menu_model';
import menuStructure from './menu.json';

@Injectable({
	providedIn: 'root'
})
export class MenuParserService {

	constructor() {
	}

	public parseConfig(): MenuRoot {
		return menuStructure;
	}
}
