import {Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {PatchBitmap, Wad} from '../../parser/wad_model';
import {WadStorageService} from '../../service/wad-storage.service';
import {EmitEvent, NgRxEventBusService} from 'ngrx-event-bus';
import {NavbarPluginFactory} from '../../../navbar/service/navbar_plugin';
import {NavbarPluginComponent} from './navbar-plugin/navbar-plugin.component';
import {NavbarEvent} from '../../../navbar/service/navbar-event';
import {WadTitleImgEvent} from './wad-title-img-event';
import {NgbCarousel, NgbSlideEvent} from '@ng-bootstrap/ng-bootstrap';

@Component({
	selector: 'app-wad-title-img',
	templateUrl: './wad-title-img.component.html',
	styleUrls: ['./wad-title-img.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class WadTitleImgComponent implements OnInit {
	wad: Wad;
	bitmaps: PatchBitmap[];
	scale = 2;
	paused = false;

	@ViewChild('carousel', {static: true}) carousel: NgbCarousel;

	constructor(private wadStorage: WadStorageService, private eventBus: NgRxEventBusService) {

	}

	togglePaused(): void {
		if (this.paused) {
			this.carousel.cycle();
		} else {
			this.carousel.pause();
		}
		this.paused = !this.paused;
	}

	ngOnInit(): void {
		this.carousel.cycle();
		this.wad = this.wadStorage.getCurrent().get().wad;
		this.bitmaps = new Array<PatchBitmap>();
		this.bitmaps.push(this.wad.title.title);
		this.bitmaps.push(this.wad.title.credit);
		this.wad.title.help.exec(ba => ba.forEach(b => this.bitmaps.push(b)));
		this.eventBus.emit(new EmitEvent(NavbarEvent.SET_NAVBAR_PLUGIN, new NavbarPluginFactory(NavbarPluginComponent, this)));

		this.eventBus.on(WadTitleImgEvent.ZOOM_CHANGED, (zoom: number) => {
			this.scale = zoom;
		});
		this.eventBus.on(WadTitleImgEvent.CAROUSEL_PAUSE, () => {
			this.togglePaused();
		});
		this.eventBus.emit(new EmitEvent(WadTitleImgEvent.IMG_CHANGED, this.bitmaps[0].header.dir.name));
	}

	onSlide(slideEvent: NgbSlideEvent): void {
		const idx = parseInt(slideEvent.current.substr(10, slideEvent.current.length), 10);
		this.eventBus.emit(new EmitEvent(WadTitleImgEvent.IMG_CHANGED, this.bitmaps[idx].header.dir.name));
	}

}
