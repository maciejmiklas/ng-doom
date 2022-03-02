import {Component, OnInit} from '@angular/core';
import * as paper from 'paper';
import {Path, Point} from 'paper';
import {WadStorageService} from '../../service/wad-storage.service';
import {WadEntry} from '../../service/wad-service-model';
import {Linedef, WadMap} from '../../parser/wad-model';
import {EmitEvent, NgRxEventBusService} from 'ngrx-event-bus';
import {MainEvent} from '../../../main/service/main-event';
import {NavbarPluginFactory} from '../../../main/service/navbar_plugin';
import {NavbarMapPluginComponent} from './navbar-map-plugin/navbar-map-plugin.component';
import {functions as mp} from '../../parser/map-parser';

@Component({
	selector: 'app-wad-map',
	templateUrl: './wad-map.component.html',
	styleUrls: ['./wad-map.component.css']
})
export class WadMapComponent implements OnInit, MapControl {

	private minX = -1;
	private minY = -1;
	private mappingMultiplier = 1;
	private zoom = 1;
	private scope: paper.PaperScope;
	private lastDragPos: paper.Point;
	private lastZoom = -1;
	private wad: WadEntry;
	private _mapNames: string[];

	constructor(private wadStorage: WadStorageService, private eventBus: NgRxEventBusService) {
	}

	onZoomChange(zoom: number): void {
		this.zoom = zoom;

		if (this.zoom > this.lastZoom) {
			this.scope.view.scale(1.2, new Point(0, 0));
		} else {
			this.scope.view.scale(0.8, new Point(0, 0));
		}

		this.lastZoom = zoom;
	}

	ngOnInit(): void {
		this.wad = this.wadStorage.getCurrent().get();
		this._mapNames = this.wad.wad.maps.map(m => m.mapDirs[0].name);
		this.eventBus.emit(new EmitEvent(MainEvent.SET_NAVBAR_PLUGIN, new NavbarPluginFactory(NavbarMapPluginComponent, this)));
	}

	private findMinX(linedefs: Linedef[]): number {
		let min = 0;
		linedefs.forEach(ld => {
			min = Math.min(min, ld.start.x, ld.end.x);
		});
		return min;
	}

	private findMinY(linedefs: Linedef[]): number {
		let min = 0;
		linedefs.forEach(ld => {
			min = Math.min(min, ld.start.y, ld.end.y);
		});
		return min;
	}

	private findMax(linedefs: Linedef[]): number {
		let min = 0;
		linedefs.forEach(ld => {
			min = Math.max(min, ld.start.x, ld.start.y, ld.end.x, ld.end.y);
		});
		return min;
	}

	private mapX(x: number): number {
		return Math.round((x + Math.abs(this.minX)) / this.mappingMultiplier);
	}

	private mapY(y: number): number {
		return Math.round((y + Math.abs(this.minY)) / this.mappingMultiplier);
	}

	onMouseDrag(point: paper.Point): void {
		if (this.lastDragPos != null) {
			this.scope.view.translate(new Point(point.x - this.lastDragPos.x, point.y - this.lastDragPos.y));
		}
		this.lastDragPos = point;
	}

	onMouseDragEnd(point: paper.Point): void {
		this.lastDragPos = null;
	}

	onPapertInit(scope: paper.PaperScope): void {
		this.scope = scope;
		const wad: WadEntry = this.wadStorage.getCurrent().get();
		this.plotMap(wad.wad.maps[0]);
	}

	private plotMap(map: WadMap): void {
		this.scope.project.activeLayer.removeChildren();

		this.minX = this.findMinX(map.linedefs);
		this.minY = this.findMinY(map.linedefs);
		const max = this.findMax(map.linedefs) + Math.max(Math.abs(this.minX), Math.abs(this.minY));
		this.mappingMultiplier = max / 1000;

		mp.normalizeLinedefs(map.linedefs).forEach(ld => {
			const path = new Path({
				strokeColor: '#66ff00',
				strokeWidth: 2,
				strokeCap: 'round'
			});
			path.add(
				new Point(ld.start.x, ld.start.y),
				new Point(ld.end.x, ld.end.y));
		});
	}

	mapNames(): string[] {
		return this._mapNames;
	}

	onMapChange(name: string) {
		this.plotMap(this.wad.wad.maps.filter(m => m.mapDirs[0].name === name)[0]);
	}
}

export interface MapControl {
	onMapChange(name: string);

	onZoomChange(zoom: number): void;

	mapNames(): string[];
}
