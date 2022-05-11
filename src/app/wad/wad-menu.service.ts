import {Injectable} from '@angular/core';
import {MenuDecorator} from '../menu/menu-model';
import {WadStorageService} from './wad-storage.service';

@Injectable({
	providedIn: 'root'
})
export class WadUploadMenuDecorator implements MenuDecorator {
	visible(): boolean {
		return true;
	}
}

@Injectable({
	providedIn: 'root'
})
export class WasLoadedMenuDecorator implements MenuDecorator {
	constructor(private wadStorage: WadStorageService) {
	}

	visible(): boolean {
		return this.wadStorage.isLoaded();
	}
}
