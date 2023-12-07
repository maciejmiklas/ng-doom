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
import {WadStorageService} from '../wad-storage.service'
import {Bitmap} from '../parser/wad-model'
import {EmitEvent, NgRxEventBusService} from '@maciejmiklas/ngrx-event-bus'
import {MainEvent} from '../../main/main-event'
import {NavbarPluginFactory} from '../../main/navbar_plugin'
import {WadPatchesNavbarComponent} from './wad-patches-navbar/wad-patches-navbar.component'
import {NgbPopover} from '@ng-bootstrap/ng-bootstrap'
import {PbmpComponent} from '../pbmp/pbmp.component'
import {NgFor} from '@angular/common'

@Component({
    selector: 'app-wad-patches',
    templateUrl: './wad-patches.component.html',
    standalone: true,
    imports: [NgFor, PbmpComponent, NgbPopover]
})
export class WadPatchesComponent implements OnInit, PatchesListControl {
	patches: Bitmap[]

	@Input()
	maxSize = 300

	@Input()
	zoom = 4

	constructor(private wadStorage: WadStorageService, private eventBus: NgRxEventBusService) {
	}

	ngOnInit(): void {
		const wad = this.wadStorage.getCurrent().get().wad
		this.patches = wad.patches
		this.eventBus.emit(new EmitEvent(MainEvent.SET_NAVBAR_PLUGIN, new NavbarPluginFactory(WadPatchesNavbarComponent, this)))
	}

	applyFilter(filter: string) {
		this.patches = this.wadStorage.getCurrent().get().wad.patches.filter(pb => pb.name.toUpperCase().includes(filter.toUpperCase()))
	}

}

export interface PatchesListControl {
	applyFilter(filter: string)
}
