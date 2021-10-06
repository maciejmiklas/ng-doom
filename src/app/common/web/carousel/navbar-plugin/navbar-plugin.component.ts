import {Component, Input, OnInit} from '@angular/core';
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

	@Input()
	showZoom = true;

	_zoom = 2;
	parent: CarouselComponent;
	title = '';

	zoomFormatter = (value) => {
		return 'x ' + value;
	};

	pauseClass(): string {
		return this.showZoom ? 'col-1' : 'col-4';
	}

	constructor(private eventBus: NgRxEventBusService) {
		this.eventBus.on(CarouselEvent.IMG_CHANGED, (name: string) => {
			this.title = name;
		});
	}

	setData(data: CarouselComponent): void {
		this.parent = data;
		this._zoom = data.zoom;
		this.showZoom = data.showZoom;
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
