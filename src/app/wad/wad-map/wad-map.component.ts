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
import {Component, OnInit} from '@angular/core'
import * as paper from 'paper'
import {Path, Point} from 'paper'
import {WadStorageService} from '../wad-storage.service'
import {DoomMap, WadEntry} from '../parser/wad-model'
import {EmitEvent, NgRxEventBusService} from '@maciejmiklas/ngrx-event-bus'
import {MainEvent} from '../../main/main-event'
import {NavbarPluginFactory} from '../../main/navbar_plugin'
import {WadMapNavbarComponent} from './wad-map-navbar/wad-map-navbar.component'
import {functions as mp} from '../parser/map-parser'
import { PaperComponent } from '../../common/paper/paper.component';

@Component({
    selector: 'app-wad-map',
    templateUrl: './wad-map.component.html',
    standalone: true,
    imports: [PaperComponent]
})
export class WadMapComponent implements OnInit, MapControl {
	private zoom = 1
	private scope: paper.PaperScope
	private lastDragPos: paper.Point
	private lastZoom = -1
	private wad: WadEntry
	private _mapNames: string[]

	constructor(private wadStorage: WadStorageService, private eventBus: NgRxEventBusService) {
	}

	onZoomChange(zoom: number): void {
		this.zoom = zoom

		if (this.zoom > this.lastZoom) {
			this.scope.view.scale(1.2, new Point(0, 0))
		} else {
			this.scope.view.scale(0.8, new Point(0, 0))
		}

		this.lastZoom = zoom
	}

	ngOnInit(): void {
		this.wad = this.wadStorage.getCurrent().get()
		this._mapNames = this.wad.wad.maps.map(m => m.mapDirs[0].name)
		this.eventBus.emit(new EmitEvent(MainEvent.SET_NAVBAR_PLUGIN, new NavbarPluginFactory(WadMapNavbarComponent, this)))
	}

	onMouseDrag(point: paper.Point): void {
		if (this.lastDragPos != null) {
			this.scope.view.translate(new Point(point.x - this.lastDragPos.x, point.y - this.lastDragPos.y))
		}
		this.lastDragPos = point
	}

	onMouseDragEnd(point: paper.Point): void {
		this.lastDragPos = null
	}

	onPapertInit(scope: paper.PaperScope): void {
		this.scope = scope
		const wad: WadEntry = this.wadStorage.getCurrent().get()
		this.plotMap(wad.wad.maps[0])
	}

	private plotMap(map: DoomMap): void {
		this.scope.project.activeLayer.removeChildren()
		mp.normalizeLinedefs(6)(map.linedefs).forEach(ld => {
			const path = new Path({
				strokeColor: '#66ff00',
				strokeWidth: 2,
				strokeCap: 'round'
			})
			path.add(
				new Point(ld.start.x, ld.start.y),
				new Point(ld.end.x, ld.end.y))
		})
	}

	mapNames(): string[] {
		return this._mapNames
	}

	onMapChange(name: string) {
		this.plotMap(this.wad.wad.maps.filter(m => m.mapDirs[0].name === name)[0])
	}
}

export interface MapControl {
	onMapChange(name: string)

	onZoomChange(zoom: number): void

	mapNames(): string[]
}
