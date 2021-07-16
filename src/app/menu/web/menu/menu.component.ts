import {Component, OnInit} from '@angular/core';
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

	constructor(private menuService: MenuService, private eventBus: NgRxEventBusService) {
	}

	ngOnInit(): void {
		this.menuRoot = this.menuService.visibleMenu();
		this.eventBus.on(Events.WAD_UPLOADED, () => {
			this.ngOnInit();
		});
	}

}
