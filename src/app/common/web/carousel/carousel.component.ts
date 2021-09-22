import {Component, ContentChild, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
import {NgbCarousel, NgbSlideEvent} from '@ng-bootstrap/ng-bootstrap';
import {EmitEvent, NgRxEventBusService} from 'ngrx-event-bus';
import {CarouselEvent} from './carousel-event';
import {NavbarEvent} from '../../../navbar/service/navbar-event';
import {NavbarPluginFactory} from '../../../navbar/service/navbar_plugin';
import {NavbarCarouselPluginComponent} from './navbar-plugin/navbar-plugin.component';

@Component({
	selector: 'app-carousel[slides][slideNames]',
	templateUrl: './carousel.component.html',
	styleUrls: ['./carousel.component.css']
})
export class CarouselComponent implements OnInit {

	@Input()
	slideInterval = 2000;

	@Input()
	pauseOnHover = true;

	@Input()
	zoom = 2;

	@Output()
	zoomChange = new EventEmitter<number>();

	@Input()
	slides: any[];

	@Input()
	slideNames: string[];

	@ContentChild(TemplateRef) templateRef: TemplateRef<any>;

	@ViewChild('carousel', {static: true}) carousel: NgbCarousel;

	paused = false;

	constructor(private eventBus: NgRxEventBusService) {

	}

	ngOnInit(): void {
		this.carousel.cycle();

		this.eventBus.on(CarouselEvent.CAROUSEL_PAUSE, () => {
			this.togglePaused();
		});

		this.eventBus.on(CarouselEvent.ZOOM_CHANGED, (zoom: number) => {
			this.zoomChange.emit(zoom);
		});

		this.eventBus.emit(new EmitEvent(NavbarEvent.SET_NAVBAR_PLUGIN, new NavbarPluginFactory(NavbarCarouselPluginComponent, this)));
		if (this.slides.length > 0) {
			this.eventBus.emit(new EmitEvent(CarouselEvent.IMG_CHANGED, this.slideNames[0]));
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
		this.eventBus.emit(new EmitEvent(CarouselEvent.IMG_CHANGED, this.slideNames[idx]));
	}
}
