import {AbstractType, Injectable, Injector} from '@angular/core';
import {MenuDecorator, MenuRoot} from './menu_model';
import menuJson from './menu.json';
import {
	WadListMenuDecorator,
	WadMapsMenuDecorator,
	WadPaletteMenuDecorator,
	WadSelectMenuDecorator,
	WadTitleImgMenuDecorator,
	WadUploadMenuDecorator
} from '../../wad/service/wad-menu.service';
import {Either} from '../../common/is/either';

@Injectable({
	providedIn: 'root'
})
export class MenuService {

	private menuStr: string = JSON.stringify(menuJson);

	private decoratorMap: Record<string, AbstractType<MenuDecorator>> = {
		dec_wad_upload: WadUploadMenuDecorator,
		dec_wad_list: WadListMenuDecorator,
		dec_wad_select: WadSelectMenuDecorator,
		dec_wad_maps: WadMapsMenuDecorator,
		dec_wad_palette: WadPaletteMenuDecorator,
		dec_wad_title_img: WadTitleImgMenuDecorator,
		dec_mid_save_load: DummyMenuDecorator,
		dec_mid_save_new: DummyMenuDecorator,
		dec_mid_save_manage: DummyMenuDecorator
	};

	constructor(private injector: Injector) {
	}

	visibleMenu(): MenuRoot {
		const copy = this.copyMenu();
		// remove hidden elements on L2
		copy.l1.forEach(l1 => {
			l1.l2 = l1.l2.filter(l2 => {
				return Either.ofNullable(this.decoratorMap[l2.decorator], () => 'Decorator not defined: ' + l2.decorator)
					.map(d => this.injector.get(d)).get().visible();
			});
		});

		// remove empty Menus on L1
		copy.l1 = copy.l1.filter(l1 => l1.l2.length > 0);
		return copy;
	}

	private copyMenu(): MenuRoot {
		return JSON.parse(this.menuStr);
	}

	menuFull(): MenuRoot {
		return this.copyMenu();
	}

	replaceMenu(menuRoot: MenuRoot): void {
		this.menuStr = JSON.stringify(menuRoot);
	}
}

@Injectable({
	providedIn: 'root'
})
export class DummyMenuDecorator implements MenuDecorator {
	visible(): boolean {
		return true;
	}
}
