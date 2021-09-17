import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {NgbCarousel, NgbSlideEvent} from '@ng-bootstrap/ng-bootstrap';
import {EmitEvent, NgRxEventBusService} from 'ngrx-event-bus';
import {CarouselEvent} from './carousel-event';

@Component({
	selector: 'app-carousel',
	templateUrl: './carousel.component.html',
	styleUrls: ['./carousel.component.css']
})
export class CarouselComponent implements OnInit {

	@Input()
	slideInterval = 2000;

	@Input()
	pauseOnHover = true;

	@Input()
	support: CarouselSupport<any>;

	@Input()
	slides: any[];

	scale = 2;
	paused = false;

	@ViewChild('carousel', {static: true}) carousel: NgbCarousel;

	constructor(private eventBus: NgRxEventBusService) {

	}

	ngOnInit(): void {
		this.eventBus.on(CarouselEvent.ZOOM_CHANGED, (zoom: number) => {
			this.scale = zoom;
		});
		this.eventBus.on(CarouselEvent.CAROUSEL_PAUSE, () => {
			this.togglePaused();
		});
		if (this.slides.length > 0) {
			this.eventBus.emit(new EmitEvent(CarouselEvent.IMG_CHANGED, this.support.getSlideTitle(0)));
		}
	}

	togglePaused(): void {
		if (this.paused) {
			this.carousel.cycle();
		} else {
			this.carousel.pause();
		}
		this.paused = !this.paused;
	}

	onSlide(slideEvent: NgbSlideEvent): void {
		const idx = parseInt(slideEvent.current.substr(10, slideEvent.current.length), 10);
		this.eventBus.emit(new EmitEvent(CarouselEvent.IMG_CHANGED, this.support.getSlideTitle(idx)));
	}
}

export interface CarouselSupport<T> {
	getSlideTitle(idx: number): string;
}
