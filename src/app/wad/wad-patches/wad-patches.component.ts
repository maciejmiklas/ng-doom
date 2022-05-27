/*
 * Copyright 2002-2019 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
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
import {Component, OnInit} from '@angular/core';
import {WadStorageService} from '../wad-storage.service';
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
		this.patches = wad.patches;
		this.eventBus.emit(new EmitEvent(MainEvent.SET_NAVBAR_PLUGIN, new NavbarPluginFactory(WadPatchesNavbarComponent, this)));
	}

	applyFilter(filter: string) {
		this.patches = this.wadStorage.getCurrent().get().wad.patches.filter(pb => pb.header.dir.name.toUpperCase().includes(filter.toUpperCase()));
	}

}

export interface PatchesListControl {
	applyFilter(filter: string);
}
