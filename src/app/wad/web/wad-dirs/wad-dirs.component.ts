import {Component, OnInit} from '@angular/core';
import {WadStorageService} from '../../service/wad-storage.service';
import {Directory} from '../../parser/wad_model';
import * as R from 'ramda';
import {EmitEvent, NgRxEventBusService} from 'ngrx-event-bus';
import {MainEvent} from '../../../main/service/main-event';
import {NavbarPluginFactory} from '../../../main/service/navbar_plugin';
import {WadDirsNavbarPluginComponent} from './wad-dirs-navbar-plugin/wad-dirs-navbar-plugin.component';

@Component({
	selector: 'app-wad-dirs',
	templateUrl: './wad-dirs.component.html'
})
export class WadDirsComponent implements OnInit, DirsListControl {
	allDirs: Directory[];
	dirs: Directory[];
	pageSize = 20;

	constructor(private wadStorage: WadStorageService, private eventBus: NgRxEventBusService) {
	}

	ngOnInit(): void {
		this.allDirs = this.wadStorage.getCurrent().get().wad.dirs;
		this.eventBus.emit(new EmitEvent(MainEvent.SET_NAVBAR_PLUGIN, new NavbarPluginFactory(WadDirsNavbarPluginComponent, this)));
		this.onPageChange(1);
	}

	onPageChange(page: number) {
		const from = (page - 1) * this.pageSize;
		const to = from + this.pageSize;
		this.dirs = R.slice(from, to)(this.allDirs);
	}

	getListSize(): number {
		return this.allDirs.length;
	}

	getPageSize(): number {
		return this.pageSize;
	}
}

export interface DirsListControl {
	onPageChange(page: number);

	getListSize(): number;

	getPageSize(): number;

}
