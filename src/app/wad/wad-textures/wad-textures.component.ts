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
import {DoomTexture} from '../parser/wad-model'
import {WadStorageService} from '../wad-storage.service'
import {EmitEvent, NgRxEventBusService} from '@maciejmiklas/ngrx-event-bus'
import {MainEvent} from '../../main/main-event'
import {NavbarPluginFactory} from '../../main/navbar_plugin'
import {WadPatchesNavbarComponent} from '../wad-patches/wad-patches-navbar/wad-patches-navbar.component'
import {NgbModal, NgbPopover} from '@ng-bootstrap/ng-bootstrap'
import {WadTextureComponent} from '../wad-texture/wad-texture.component'
import {PbmpComponent} from '../pbmp/pbmp.component'
import {NgFor} from '@angular/common'

@Component({
    selector: 'app-wad-textures',
    templateUrl: './wad-textures.component.html',
    standalone: true,
    imports: [NgFor, PbmpComponent, NgbPopover]
})
export class WadTexturesComponent implements OnInit, TexturesListControl {

	@Input()
	maxSize = 300

	@Input()
	zoom = 2

	textures: DoomTexture[]

	constructor(private wadStorage: WadStorageService, private eventBus: NgRxEventBusService, private modal: NgbModal) {
	}

	ngOnInit(): void {
		const wad = this.wadStorage.getCurrent().get().wad
		this.textures = wad.textures
		this.eventBus.emit(new EmitEvent(MainEvent.SET_NAVBAR_PLUGIN, new NavbarPluginFactory(WadPatchesNavbarComponent, this)))
	}

	applyFilter(filter: string) {
		this.wadStorage.getCurrent().get().wad.textures
		this.textures = this.wadStorage.getCurrent().get().wad.textures.filter(tx => tx.name.toUpperCase().includes(filter.toUpperCase()))
	}

	onTextureClick(name: string) {
		const comp = this.modal.open(WadTextureComponent, {scrollable: true, animation: true, size: 'xl'})
		comp.componentInstance.name = name
	}

}

export interface TexturesListControl {
	applyFilter(filter: string)
}
