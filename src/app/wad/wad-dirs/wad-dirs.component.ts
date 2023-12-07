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
import {Component, OnInit} from '@angular/core'
import {WadStorageService} from '../wad-storage.service'
import {Directory} from '../parser/wad-model'
import * as R from 'ramda'
import {EmitEvent, NgRxEventBusService} from '@maciejmiklas/ngrx-event-bus'
import {MainEvent} from '../../main/main-event'
import {NavbarPluginFactory} from '../../main/navbar_plugin'
import {WadDirsNavbarComponent} from './wad-dirs-navbar/wad-dirs-navbar.component'
import {WadDirComponent} from '../wad-dir/wad-dir.component'
import {NgFor} from '@angular/common'

@Component({
    selector: 'app-wad-dirs',
    templateUrl: './wad-dirs.component.html',
    standalone: true,
    imports: [NgFor, WadDirComponent]
})
export class WadDirsComponent implements OnInit, DirsListControl {
	initDirs: Directory[]
	allDirs: Directory[]
	pageDirs: Directory[]
	pageSize = 20

	constructor(private wadStorage: WadStorageService, private eventBus: NgRxEventBusService) {
	}

	ngOnInit(): void {
		this.initDirs = this.wadStorage.getCurrent().get().wad.dirs
		this.allDirs = this.initDirs
		this.eventBus.emit(new EmitEvent(MainEvent.SET_NAVBAR_PLUGIN, new NavbarPluginFactory(WadDirsNavbarComponent, this)))
		this.onPageChange(1)
	}

	applyFilter(filter: string) {
		if (R.isEmpty(filter)) {
			this.allDirs = this.initDirs
		} else {
			const filterFun = filterDir(filter)
			this.allDirs = R.filter(filterFun, this.initDirs)
			this.onPageChange(1)
		}
	}

	onPageChange(page: number) {
		const from = (page - 1) * this.pageSize
		const to = from + this.pageSize
		this.pageDirs = R.slice(from, to)(this.allDirs)
	}

	getListSize(): number {
		return this.allDirs.length
	}

	getPageSize(): number {
		return this.pageSize
	}
}

const filterDir = (filter: string) => (dir: Directory): boolean =>
	(dir.filepos + ',' + dir.name + ',' + dir.idx + ',' + dir.size).toLowerCase().includes(filter.toLowerCase())


export interface DirsListControl {
	onPageChange(page: number)

	getListSize(): number

	getPageSize(): number

	applyFilter(filter: string)

}
