import {Component, EventEmitter, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {MenuService} from '../../service/menu.service';
import {MenuRoot, MenuState} from '../../service/menu-model';
import {NgRxEventBusService} from 'ngrx-event-bus';
import {Event} from '../../../common/is/event';
import {Router} from '@angular/router';

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
		this.loadMenu();
		this.eventBus.on(Event.WAD_UPLOAD, () => {
			this.loadMenu();
		});
		this.router.navigate([this.menuService.routePath]);
	}

	private loadMenu(): void {
		this.menuRoot = this.menuService.visibleMenu;
	}

	onL2Click(state: MenuState): void {
		this.menuService.state = state;
		this.selection.emit(state);
	}

	get state(): MenuState {
		return this.menuService.state;
	}

}
