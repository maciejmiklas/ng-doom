import {AbstractType, Injectable, Injector} from '@angular/core';
import {MenuDecorator, MenuRoot} from './menu_model';
import menuJson from './menu.json';
import {
	WadListMenuDecorator,
	WadMapsMenuDecorator,
	WadPaletteMenuDecorator,
	WadSelectMenuDecorator,
	WadTitleImgMenuDecorator
} from '../../wad/service/wad-menu.service';
import {Either} from '../../common/is/either';

@Injectable({
	providedIn: 'root'
})
export class MenuService {

	private menuRoot: MenuRoot = menuJson;

	private decoratorMap: Record<string, AbstractType<MenuDecorator>> = {
		dec_wad_upload: DummyMenuService,
		dec_wad_list: WadListMenuDecorator,
		dec_wad_select: WadSelectMenuDecorator,
		dec_wad_maps: WadMapsMenuDecorator,
		dec_wad_palette: WadPaletteMenuDecorator,
		dec_wad_title_img: WadTitleImgMenuDecorator,
		dec_mid_save_load: DummyMenuService,
		dec_mid_save_new: DummyMenuService,
		dec_mid_save_manage: DummyMenuService
	};

	constructor(private injector: Injector) {
		const dec: MenuDecorator = this.injector.get(this.decoratorMap['dec_wad_list']);
		const vid = dec.visible();
		console.log('');
	}

	visibleMenu(): MenuRoot {
		const copy = {...this.menuRoot};

		// remove hidden elements on L2
		copy.l1.forEach(l1 => {
			l1.l2 = l1.l2.filter(l2 => {
				return Either.ofNullable(this.decoratorMap[l2.decorator], () => 'Decorator not defined: ' + l2.decorator).map(d => this.injector.get(d)).get().visible();
				// ret.visible();
				// const dec: MenuDecorator = this.injector.get(this.decoratorMap[l2.decorator]);
				// return true;
			});
		});

		// remove empty Menus on L1
		copy.l1 = copy.l1.filter(l1 => l1.l2.length > 0);
		return copy;
	}

	menuFull(): MenuRoot {
		return this.menuRoot;
	}

	replaceMenu(menuRoot: MenuRoot): void {
		this.menuRoot = menuRoot;
	}
}

@Injectable({
	providedIn: 'root'
})
export class DummyMenuService implements MenuDecorator {
	visible(): boolean {
		return true;
	}
}
