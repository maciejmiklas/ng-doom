import {Component, OnInit} from '@angular/core';
import {NavbarPlugin} from '../../../../main/service/navbar_plugin';
import {CarouselControl} from '../carousel.component';

@Component({
	selector: 'app-navbar-map-plugin',
	templateUrl: './navbar-plugin.component.html',
	styleUrls: ['./navbar-plugin.component.scss'],
})
export class NavbarCarouselPluginComponent implements NavbarPlugin<CarouselControl> {

	control: CarouselControl;

	constructor() {
	}

	zoomFormatter = (value) => {
		return 'x ' + value;
	};

	pauseClass(): string {
		return this.control.zoomVisible() ? 'col-1' : 'col-4';
	}

	setData(carouselControl: CarouselControl): void {
		this.control = carouselControl;
	}

	set zoom(zoom: number) {
		this.control.setZoom(zoom);
	}

	get zoom(): number {
		return this.control.getZoom();
	}

	togglePaused(): void {
		this.control.togglePaused();
	}


}
