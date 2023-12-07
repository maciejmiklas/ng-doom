/*
 * Copyright 2022 Maciej Miklas (MIT License)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import {Component, Input, OnInit} from '@angular/core'
import {WadStorageService} from "../wad-storage.service"
import {EmitEvent, NgRxEventBusService} from '@maciejmiklas/ngrx-event-bus'
import {RgbaBitmap} from "../parser/wad-model"
import {MainEvent} from "../../main/main-event"
import {NavbarPluginFactory} from "../../main/navbar_plugin"
import {WadPatchesNavbarComponent} from "../wad-patches/wad-patches-navbar/wad-patches-navbar.component"
import {NgbPopover} from '@ng-bootstrap/ng-bootstrap'
import {PbmpComponent} from '../pbmp/pbmp.component'
import {NgFor} from '@angular/common'

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

