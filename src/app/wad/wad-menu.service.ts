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
export class WadListMenuDecorator implements MenuDecorator {

	constructor(private wadStorage: WadStorageService) {
	}

	visible(): boolean {
		return this.wadStorage.isLoaded();
	}
}

@Injectable({
	providedIn: 'root'
})
export class WadSpritesMenuDecorator implements MenuDecorator {

	constructor(private wadStorage: WadStorageService) {
	}

	visible(): boolean {
		return this.wadStorage.isLoaded();
	}
}

@Injectable({
	providedIn: 'root'
})
export class WadSelectMenuDecorator implements MenuDecorator {

	constructor(private wadStorage: WadStorageService) {
	}

	visible(): boolean {
		return this.wadStorage.isLoaded();
	}
}

@Injectable({
	providedIn: 'root'
})
export class WadMapsMenuDecorator implements MenuDecorator {
	constructor(private wadStorage: WadStorageService) {
	}

	visible(): boolean {
		return this.wadStorage.isLoaded();
	}
}

@Injectable({
	providedIn: 'root'
})
export class WadPlaypalMenuDecorator implements MenuDecorator {
	constructor(private wadStorage: WadStorageService) {
	}

	visible(): boolean {
		return this.wadStorage.isLoaded();
	}
}

@Injectable({
	providedIn: 'root'
})
export class WadTitleImgMenuDecorator implements MenuDecorator {
	constructor(private wadStorage: WadStorageService) {
	}

	visible(): boolean {
		return this.wadStorage.isLoaded();
	}
}

@Injectable({
	providedIn: 'root'
})
export class WadDirsMenuDecorator implements MenuDecorator {
	constructor(private wadStorage: WadStorageService) {
	}

	visible(): boolean {
		return this.wadStorage.isLoaded();
	}
}

@Injectable({
	providedIn: 'root'
})
export class GameNewMenuDecorator implements MenuDecorator {
	constructor(private wadStorage: WadStorageService) {
	}

	visible(): boolean {
		return this.wadStorage.isLoaded();
	}
}
