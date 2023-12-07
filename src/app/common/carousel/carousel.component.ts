/*
 * Copyright 2022 Maciej Miklas (MIT License)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
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
import {NgbCarousel, NgbSlide, NgbSlideEvent} from '@ng-bootstrap/ng-bootstrap'
import {EmitEvent, NgRxEventBusService} from '@maciejmiklas/ngrx-event-bus'
import {MainEvent} from '../../main/main-event'
import {NavbarPluginFactory} from '../../main/navbar_plugin'
import {NavbarCarouselPluginComponent} from './navbar-plugin/navbar-plugin.component'
import {Slide} from './carousel-model'
import {NgFor, NgTemplateOutlet} from '@angular/common'

@Component({
    selector: 'app-carousel[slides]',
    templateUrl: './carousel.component.html',
    standalone: true,
    imports: [NgbCarousel, NgFor, NgbSlide, NgTemplateOutlet]
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
		return parseInt(name.substring(10, name.length), 10)
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
