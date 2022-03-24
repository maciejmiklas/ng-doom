import {Component, EventEmitter, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {MenuService} from './menu.service';
import {MenuRoot, MenuState} from './menu-model';
import {EmitEvent, NgRxEventBusService} from 'ngrx-event-bus';
import {Router} from '@angular/router';
import {WadEvent} from '../wad/wad-event';
import {MenuEvent} from './menu-event';

@Component({
	selector: 'app-menu',
	templateUrl: './menu.component.html',
	styleUrls: ['./menu.component.scss'],
	encapsulation: ViewEncapsulation.None // TODO '<ngb-panel cardClass=....' does not support encapsulation?
})
export class MenuComponent implements OnInit {

	menuRoot: MenuRoot;

	@Output()
	private selection = new EventEmitter<MenuState>();

	constructor(private menuService: MenuService, private eventBus: NgRxEventBusService, private router: Router) {
	}

	ngOnInit(): void {
		this.reloadMenu();
		this.eventBus.on(WadEvent.WAD_UPLOADED, () => {
			this.reloadMenu();
		});
		this.router.navigate([this.menuService.routePath]);
	}

	private reloadMenu(): void {
		this.menuRoot = this.menuService.visibleMenu;
	}

	onL2Click(state: MenuState): void {
		this.menuService.state = state;
		this.selection.emit(state);
		this.eventBus.emit(new EmitEvent(MenuEvent.MENU_SELECTED, state));
	}

	get state(): MenuState {
		return this.menuService.state;
	}

}
