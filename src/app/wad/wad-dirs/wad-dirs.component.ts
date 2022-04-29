import {Component, OnInit} from '@angular/core';
import {WadStorageService} from '../wad-storage.service';
import {Directory} from '../parser/wad-model';
import * as R from 'ramda';
import {EmitEvent, NgRxEventBusService} from 'ngrx-event-bus';
import {MainEvent} from '../../main/service/main-event';
import {NavbarPluginFactory} from '../../main/service/navbar_plugin';
import {WadDirsNavbarComponent} from './wad-dirs-navbar/wad-dirs-navbar.component';

@Component({
	selector: 'app-wad-dirs',
	templateUrl: './wad-dirs.component.html',
	styleUrls: ['./wad-dirs.component.scss']
})
export class WadDirsComponent implements OnInit, DirsListControl {
	initDirs: Directory[];
	allDirs: Directory[];
	pageDirs: Directory[];
	pageSize = 20;

	constructor(private wadStorage: WadStorageService, private eventBus: NgRxEventBusService) {
	}

	ngOnInit(): void {
		this.initDirs = this.wadStorage.getCurrent().get().wad.dirs;
		this.allDirs = this.initDirs;
		this.eventBus.emit(new EmitEvent(MainEvent.SET_NAVBAR_PLUGIN, new NavbarPluginFactory(WadDirsNavbarComponent, this)));
		this.onPageChange(1);
	}

	applyFilter(filter: string) {
		if (R.isEmpty(filter)) {
			this.allDirs = this.initDirs;
		} else {
			const filterFun = filterDir(filter);
			this.allDirs = R.filter(filterFun, this.initDirs);
			this.onPageChange(1);
		}
	}

	onPageChange(page: number) {
		const from = (page - 1) * this.pageSize;
		const to = from + this.pageSize;
		this.pageDirs = R.slice(from, to)(this.allDirs);
	}

	getListSize(): number {
		return this.allDirs.length;
	}

	getPageSize(): number {
		return this.pageSize;
	}
}

const filterDir = (filter: string) => (dir: Directory): boolean =>
	(dir.filepos + ',' + dir.name + ',' + dir.idx + ',' + dir.size).toLowerCase().includes(filter.toLowerCase());


export interface DirsListControl {
	onPageChange(page: number);

	getListSize(): number;

	getPageSize(): number;

	applyFilter(filter: string);

}
