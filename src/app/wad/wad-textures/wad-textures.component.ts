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
import {Component, Input, OnInit} from '@angular/core';
import {DoomTexture} from '../parser/wad-model';
import {WadStorageService} from '../wad-storage.service';
import {EmitEvent, NgRxEventBusService} from 'ngrx-event-bus';
import {MainEvent} from '../../main/service/main-event';
import {NavbarPluginFactory} from '../../main/service/navbar_plugin';
import {WadPatchesNavbarComponent} from '../wad-patches/wad-patches-navbar/wad-patches-navbar.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {WadTextureComponent} from '../wad-texture/wad-texture.component';

@Component({
	selector: 'app-wad-textures',
	templateUrl: './wad-textures.component.html',
	styleUrls: ['./wad-textures.component.scss']
})
export class WadTexturesComponent implements OnInit, TexturesListControl {

	@Input()
	zoom = 2;

	@Input()
	maxSize = 300;

	textures: DoomTexture[];

	constructor(private wadStorage: WadStorageService, private eventBus: NgRxEventBusService, private modal: NgbModal) {
	}

	ngOnInit(): void {
		const wad = this.wadStorage.getCurrent().get().wad;
		this.textures = wad.textures;
		this.eventBus.emit(new EmitEvent(MainEvent.SET_NAVBAR_PLUGIN, new NavbarPluginFactory(WadPatchesNavbarComponent, this)));
	}

	applyFilter(filter: string) {
		this.wadStorage.getCurrent().get().wad.textures;
		this.textures = this.wadStorage.getCurrent().get().wad.textures.filter(tx => tx.name.toUpperCase().includes(filter.toUpperCase()));
	}

	onTextureClick(name: string) {
		const comp = this.modal.open(WadTextureComponent, {scrollable: true, animation: true, size: 'xl'});
		comp.componentInstance.name = name;
	}

}

export interface TexturesListControl {
	applyFilter(filter: string);
}
