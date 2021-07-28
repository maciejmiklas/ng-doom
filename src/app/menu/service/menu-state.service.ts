import {Injectable} from '@angular/core';

@Injectable({
	providedIn: 'root'
})
export class MenuStateService {

	activeL1 = 'm1_manage_wads';
	activeL2 = 'm2_wad_upload';

	constructor() {
	}
}
