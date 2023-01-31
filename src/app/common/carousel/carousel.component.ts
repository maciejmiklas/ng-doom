/*
 * Copyright 2022 Maciej Miklas
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
	AfterViewInit,
	Component,
	ContentChild,
	EventEmitter,
	Input,
	OnInit,
	Output,
	TemplateRef,
	ViewChild
} from '@angular/core'
import {NgbCarousel, NgbSlideEvent} from '@ng-bootstrap/ng-bootstrap'
import {EmitEvent, NgRxEventBusService} from '@maciejmiklas/ngrx-event-bus'
import {MainEvent} from '../../main/main-event'
import {NavbarPluginFactory} from '../../main/navbar_plugin'
import {NavbarCarouselPluginComponent} from './navbar-plugin/navbar-plugin.component'
import {Slide} from './carousel-model'

@Component({
	selector: 'app-carousel[slides]',
	templateUrl: './carousel.component.html'
})
export class CarouselComponent implements OnInit, AfterViewInit, CarouselControl {

	@Input()
	slideInterval = 2000

	@Input()
	pauseOnHover = true

	@Input()
	showZoom = true

	@Input()
	zoom = 2

	@Output()
	zoomChange = new EventEmitter<number>()

	@Input()
	slides: Slide[]

	private startSlide = 0

	@ContentChild(TemplateRef) templateRef: TemplateRef<any>

	@ViewChild('carousel', {static: true}) carousel: NgbCarousel

	paused = false

	private slideIdx = 0

	constructor(private eventBus: NgRxEventBusService) {

	}

	zoomVisible(): boolean {
		return this.showZoom
	}

	ngOnInit(): void {
		this.carousel.cycle()
		this.eventBus.emit(new EmitEvent(MainEvent.SET_NAVBAR_PLUGIN, new NavbarPluginFactory(NavbarCarouselPluginComponent, this)))
	}

	togglePaused(): void {
		if (this.paused) {
			this.carousel.cycle()
		} else {
			this.carousel.pause()
		}
		this.paused = !this.paused
	}

	onSlide(slideEvent: NgbSlideEvent): void {
		this.slideIdx = this.parseSlideIdx(slideEvent.current) - this.startSlide
	}

	private parseSlideIdx(name: string): number {
		return parseInt(name.substr(10, name.length), 10)
	}

	ngAfterViewInit(): void {
		this.startSlide = this.parseSlideIdx(this.carousel.activeId)
	}

	getZoom(): number {
		return this.zoom
	}

	setZoom(zoom: number): void {
		this.zoom = zoom
		this.zoomChange.emit(zoom)
	}

	isPaused(): boolean {
		return this.paused
	}

	getTitle(): string {
		return this.slides[this.slideIdx].name
	}
}

export interface CarouselControl {
	togglePaused(): void

	isPaused(): boolean

	getZoom(): number

	setZoom(zoom: number): void

	zoomVisible(): boolean

	getTitle(): string
}
