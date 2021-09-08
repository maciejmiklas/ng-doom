import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {PatchBitmap, Wad} from '../../parser/wad_model';
import {Log} from '../../../common/is/log';
import {WadStorageService} from '../../service/wad-storage.service';
import {EmitEvent, NgRxEventBusService} from 'ngrx-event-bus';
import {Event} from '../../../common/is/event';
import {NavbarPluginFactory} from '../../../navbar/service/navbar_plugin';
import {NavbarPluginComponent} from './navbar-plugin/navbar-plugin.component';

@Component({
	selector: 'app-wad-title-img',
	templateUrl: './wad-title-img.component.html',
	styleUrls: ['./wad-title-img.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class WadTitleImgComponent implements OnInit {
	static CMP = 'app-wad-title-img';
	wad: Wad;
	bitmaps: PatchBitmap[];
	scale = 2;

	constructor(private wadStorage: WadStorageService, private eventBus: NgRxEventBusService) {

	}

	ngOnInit(): void {
		if (!this.wadStorage.isLoaded()) {
			Log.error(WadTitleImgComponent.CMP, 'WAD not Loaded');
			return;
		}
		this.wad = this.wadStorage.getCurrent().get().wad;
		this.bitmaps = new Array<PatchBitmap>();
		this.bitmaps.push(this.wad.title.title);
		this.bitmaps.push(this.wad.title.credit);
		this.wad.title.help.exec(ba => ba.forEach(b => this.bitmaps.push(b)));
		this.eventBus.emit(new EmitEvent(Event.SET_NAVBAR_PLUGIN, new NavbarPluginFactory(NavbarPluginComponent, this)));
	}

}
