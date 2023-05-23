/*
 * Copyright 2022 Maciej Miklas
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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
import {Component, Input, OnInit} from '@angular/core'
import {WadStorageService} from "../wad-storage.service"
import {EmitEvent, NgRxEventBusService} from '@maciejmiklas/ngrx-event-bus'
import {RgbaBitmap} from "../parser/wad-model"
import {MainEvent} from "../../main/main-event"
import {NavbarPluginFactory} from "../../main/navbar_plugin"
import {WadPatchesNavbarComponent} from "../wad-patches/wad-patches-navbar/wad-patches-navbar.component"
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { PbmpComponent } from '../pbmp/pbmp.component';
import { NgFor } from '@angular/common';

@Component({
    selector: 'app-wad-flats',
    templateUrl: './wad-flats.component.html',
    standalone: true,
    imports: [NgFor, PbmpComponent, NgbPopover]
})
export class WadFlatsComponent implements OnInit, FlatsListControl {

	@Input()
	zoom = 4

	@Input()
	maxSize = 300

	flats: RgbaBitmap[]

	constructor(private wadStorage: WadStorageService, private eventBus: NgRxEventBusService) {
	}

	ngOnInit(): void {
		this.flats = this.wadStorage.getCurrent().get().wad.flatBitmaps
		this.eventBus.emit(new EmitEvent(MainEvent.SET_NAVBAR_PLUGIN, new NavbarPluginFactory(WadPatchesNavbarComponent, this)))
	}

	applyFilter(filter: string) {
		this.flats = this.wadStorage.getCurrent().get().wad.flatBitmaps.filter(fl => fl.name.toUpperCase().includes(filter.toUpperCase()))
	}
}

export interface FlatsListControl {
	applyFilter(filter: string)
}

