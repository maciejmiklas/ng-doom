import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {MenuService} from '../../service/menu.service';
import {MenuRoot} from '../../service/menu_model';
import {NgRxEventBusService} from 'ngrx-event-bus';
import {Events} from '../../../common/is/Events';

@Component({
	selector: 'app-menu',
	templateUrl: './menu.component.html'
})
export class MenuComponent implements OnInit {

	menuRoot: MenuRoot;
	activeL1 = 'm1_manage_wads';
	activeL2 = 'm2_wad_upload';

	constructor(private menuService: MenuService, private eventBus: NgRxEventBusService, private changeDetectorRef: ChangeDetectorRef) {
	}

	ngOnInit(): void {
		this.loadMenu();
		this.eventBus.on(Events.WAD_UPLOADED, () => {
			this.loadMenu();
		});
	}

	private loadMenu(): void {
		this.menuRoot = this.menuService.visibleMenu();
	}

}
