import {Component, OnInit} from '@angular/core';
import {NavbarPlugin} from '../../../../navbar/service/navbar_plugin';
import {WadTitleImgComponent} from '../wad-title-img.component';
import {EmitEvent, NgRxEventBusService} from 'ngrx-event-bus';
import {WadTitleImgEvent} from '../wad-title-img-event';

@Component({
	selector: 'app-navbar-plugin',
	templateUrl: './navbar-plugin.component.html',
	styleUrls: ['./navbar-plugin.component.scss'],
})
export class NavbarPluginComponent implements NavbarPlugin<WadTitleImgComponent>, OnInit {
	_zoom = 2;
	parent: WadTitleImgComponent;
	title = '';
	formatter = (value) => {
		return 'x ' + value;
	}

	constructor(private eventBus: NgRxEventBusService) {
		this.eventBus.on(WadTitleImgEvent.IMG_CHANGED, (name: string) => {
			this.title = name;
		});
	}

	setData(data: WadTitleImgComponent): void {
		this.parent = data;
	}

	set zoom(zoom: number) {
		this._zoom = zoom;
		this.eventBus.emit(new EmitEvent(WadTitleImgEvent.ZOOM_CHANGED, zoom));
	}

	get zoom(): number {
		return this._zoom;
	}

	togglePaused(): void {
		this.eventBus.emit(new EmitEvent(WadTitleImgEvent.CAROUSEL_PAUSE));
	}

	ngOnInit(): void {
	}

}
