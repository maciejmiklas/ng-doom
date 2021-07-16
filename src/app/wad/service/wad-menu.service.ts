import {Injectable} from '@angular/core';
import {MenuDecorator} from '../../menu/service/menu_model';
import {CurrentWadService} from './current-wad.service';

@Injectable({
	providedIn: 'root',
	useValue: 'WadUploadMenuDecorator'
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

	constructor(private currentWadService: CurrentWadService) {
	}

	visible(): boolean {
		return this.currentWadService.isLoaded();
	}
}

@Injectable({
	providedIn: 'root'
})
export class WadSelectMenuDecorator implements MenuDecorator {
	visible(): boolean {
		return false;
	}
}

@Injectable({
	providedIn: 'root'
})
export class WadMapsMenuDecorator implements MenuDecorator {
	visible(): boolean {
		return false;
	}
}

@Injectable({
	providedIn: 'root'
})
export class WadPaletteMenuDecorator implements MenuDecorator {
	visible(): boolean {
		return false;
	}
}

@Injectable({
	providedIn: 'root'
})
export class WadTitleImgMenuDecorator implements MenuDecorator {
	visible(): boolean {
		return false;
	}
}
