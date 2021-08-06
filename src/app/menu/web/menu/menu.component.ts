import {Component, EventEmitter, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {MenuService} from '../../service/menu.service';
import {MenuRoot} from '../../service/menu-model';
import {NgRxEventBusService} from 'ngrx-event-bus';
import {Event} from '../../../common/is/event';
import {MenuStateService} from '../../service/menu-state.service';

@Component({
	selector: 'app-menu',
	templateUrl: './menu.component.html',
	styleUrls: ['./menu.component.scss'],
	encapsulation: ViewEncapsulation.None // TODO '<ngb-panel cardClass=....' does not support encapsulation?
})
export class MenuComponent implements OnInit {

	menuRoot: MenuRoot;

	@Output()
	private selection = new EventEmitter<string>();

	constructor(private menuService: MenuService, private menuState: MenuStateService, private eventBus: NgRxEventBusService) {
	}

	ngOnInit(): void {
		this.loadMenu();
		this.eventBus.on(Event.WAD_UPLOAD, () => {
			this.loadMenu();
		});
	}

	private loadMenu(): void {
		this.menuRoot = this.menuService.visibleMenu();
	}

	onL2Click(id: string): void {
		this.menuState.activeL2 = id;
		this.selection.emit(id);
	}

}
