import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {PatchBitmap, Wad} from '../../parser/wad_model';
import {WadStorageService} from '../../service/wad-storage.service';
import {NgRxEventBusService} from 'ngrx-event-bus';

@Component({
	selector: 'app-wad-title-img',
	templateUrl: './wad-title-img.component.html',
	styleUrls: ['./wad-title-img.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class WadTitleImgComponent implements OnInit {
	wad: Wad;
	bitmaps: PatchBitmap[];
	bitmapNames: string[];
	zoom = 2;
	paused = false;

	constructor(private wadStorage: WadStorageService, private eventBus: NgRxEventBusService) {

	}

	ngOnInit(): void {
		this.wad = this.wadStorage.getCurrent().get().wad;
		this.bitmaps = new Array<PatchBitmap>();
		this.bitmaps.push(this.wad.title.title);
		this.bitmaps.push(this.wad.title.credit);
		this.wad.title.help.exec(ba => ba.forEach(b => this.bitmaps.push(b)));

		this.bitmapNames = this.bitmaps.map(b => b.header.dir.name);
	}
}
