import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {Wad} from '../../parser/wad_model';
import {WadStorageService} from '../../service/wad-storage.service';
import {Slide} from '../../../common/web/carousel/carousel-model';
import {EmitEvent, NgRxEventBusService} from 'ngrx-event-bus';
import {MainEvent} from '../../../main/service/main-event';

@Component({
	selector: 'app-wad-title-img',
	templateUrl: './wad-title-img.component.html',
	styleUrls: ['./wad-title-img.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class WadTitleImgComponent implements OnInit {
	private wad: Wad;
	slides: Slide[];
	zoom = 2;
	paused = false;

	constructor(private wadStorage: WadStorageService, private eventBus: NgRxEventBusService) {

	}

	ngOnInit(): void {
		this.eventBus.emit(new EmitEvent(MainEvent.SET_MAIN_OVERFLOW, 'hidden'));
		this.wad = this.wadStorage.getCurrent().get().wad;
		this.slides = this.createSlides(this.wad);
	}

	private createSlides(wad: Wad): Slide[] {
		const bitmaps = new Array<Slide>();
		bitmaps.push({item: wad.title.title, name: wad.title.title.header.dir.name});
		bitmaps.push({item: wad.title.credit, name: wad.title.credit.header.dir.name});
		bitmaps.push({item: wad.title.mDoom, name: wad.title.mDoom.header.dir.name});
		wad.title.help.exec(ba => ba.forEach(b => bitmaps.push({item: b, name: b.header.dir.name})));
		return bitmaps;
	}
}
