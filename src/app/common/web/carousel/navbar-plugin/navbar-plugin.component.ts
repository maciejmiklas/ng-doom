import {Component, OnInit} from '@angular/core';
import {NavbarPlugin} from '../../../../navbar/service/navbar_plugin';
import {EmitEvent, NgRxEventBusService} from 'ngrx-event-bus';
import {CarouselComponent} from '../carousel.component';
import {CarouselEvent} from '../carousel-event';

@Component({
	selector: 'app-navbar-plugin',
	templateUrl: './navbar-plugin.component.html',
	styleUrls: ['./navbar-plugin.component.scss'],
})
export class NavbarCarouselPluginComponent implements NavbarPlugin<CarouselComponent>, OnInit {
	_zoom = 2;
	parent: CarouselComponent;
	title = '';
	formatter = (value) => {
		return 'x ' + value;
	}

	constructor(private eventBus: NgRxEventBusService) {
		this.eventBus.on(CarouselEvent.IMG_CHANGED, (name: string) => {
			this.title = name;
		});
	}

	setData(data: CarouselComponent): void {
		this.parent = data;
	}

	set zoom(zoom: number) {
		this._zoom = zoom;
		this.eventBus.emit(new EmitEvent(CarouselEvent.ZOOM_CHANGED, zoom));
	}

	get zoom(): number {
		return this._zoom;
	}

	togglePaused(): void {
		this.eventBus.emit(new EmitEvent(CarouselEvent.CAROUSEL_PAUSE));
	}

	ngOnInit(): void {
	}

}
