import {AfterViewInit, Component, ContentChild, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
import {NgbCarousel, NgbSlideEvent} from '@ng-bootstrap/ng-bootstrap';
import {EmitEvent, NgRxEventBusService} from 'ngrx-event-bus';
import {CarouselEvent} from './carousel-event';
import {NavbarEvent} from '../../../main/service/navbar-event';
import {NavbarPluginFactory} from '../../../main/service/navbar_plugin';
import {NavbarCarouselPluginComponent} from './navbar-plugin/navbar-plugin.component';
import {Slide} from './carousel-model';

@Component({
	selector: 'app-carousel[slides]',
	templateUrl: './carousel.component.html',
	styleUrls: ['./carousel.component.scss']
})
export class CarouselComponent implements OnInit, AfterViewInit {

	@Input()
	slideInterval = 2000;

	@Input()
	pauseOnHover = true;

	@Input()
	showZoom = true;

	@Input()
	zoom = 2;

	@Output()
	zoomChange = new EventEmitter<number>();

	@Input()
	slides: Slide[];

	private startSlide = 0;

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
			this.eventBus.emit(new EmitEvent(CarouselEvent.IMG_CHANGED, this.slides[0].name));
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
		const idx = this.parseSlideIdx(slideEvent.current) - this.startSlide;
		this.eventBus.emit(new EmitEvent(CarouselEvent.IMG_CHANGED, this.slides[idx].name));
	}

	private parseSlideIdx(name: string): number {
		return parseInt(name.substr(10, name.length), 10);
	}

	ngAfterViewInit(): void {
		this.startSlide = this.parseSlideIdx(this.carousel.activeId);
	}
}
