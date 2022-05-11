import {Component, OnInit} from '@angular/core';
import {WadStorageService} from '../wad-storage.service';
import {functions as tp} from '../parser/texture-parser';
import {PatchBitmap} from '../parser/wad-model';
import {EmitEvent, NgRxEventBusService} from 'ngrx-event-bus';
import {MainEvent} from '../../main/service/main-event';
import {NavbarPluginFactory} from '../../main/service/navbar_plugin';
import {WadPatchesNavbarComponent} from './wad-patches-navbar/wad-patches-navbar.component';

@Component({
	selector: 'app-wad-patches',
	templateUrl: './wad-patches.component.html',
	styleUrls: ['./wad-patches.component.scss']
})
export class WadPatchesComponent implements OnInit, PatchesListControl {

	zoom = 4;
	maxSize = 300;
	patches: PatchBitmap[];

	constructor(private wadStorage: WadStorageService, private eventBus: NgRxEventBusService) {
	}

	ngOnInit(): void {
		const wad = this.wadStorage.getCurrent().get().wad;
		this.patches = tp.parsePatches(wad.bytes, wad.dirs);
		this.eventBus.emit(new EmitEvent(MainEvent.SET_NAVBAR_PLUGIN, new NavbarPluginFactory(WadPatchesNavbarComponent, this)));
	}

	applyFilter(filter: string) {
		const wad = this.wadStorage.getCurrent().get().wad;
		this.patches = tp.parsePatches(wad.bytes, wad.dirs).filter(pb => pb.header.dir.name.toUpperCase().includes(filter.toUpperCase()));
	}

}

export interface PatchesListControl {
	applyFilter(filter: string);
}
