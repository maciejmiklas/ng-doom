import {Injectable} from '@angular/core';
import {MenuL1} from './menu_model';
import {yaml} from 'js-yaml';

@Injectable({
	providedIn: 'root'
})
export class MenuParserService {

	constructor() {
	}

	public parseConfig(): MenuL1 {
		return null;
	}
}
