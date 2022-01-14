import {Component, OnInit} from '@angular/core';
import {Path, Point} from 'paper';
import {WadStorageService} from '../../service/wad-storage.service';
import {WadEntry} from '../../service/wad-service-model';
import {Linedef, WadMap} from '../../parser/wad_model';
import Project = paper.Project;

@Component({
	selector: 'app-wad-map',
	templateUrl: './wad-map.component.html',
	styleUrls: ['./wad-map.component.css']
})
export class WadMapComponent implements OnInit {

	minX = -1;
	minY = -1;
	scale = 1;

	constructor(private wadStorage: WadStorageService) {
	}

	ngOnInit(): void {
	}

	findMinX(linedefs: Linedef[]): number {
		let min = 0;
		linedefs.forEach(ld => {
			min = Math.min(min, ld.start.x, ld.end.x);
		});
		return min;
	}

	findMinY(linedefs: Linedef[]): number {
		let min = 0;
		linedefs.forEach(ld => {
			min = Math.min(min, ld.start.y, ld.end.y);
		});
		return min;
	}

	findMax(linedefs: Linedef[]): number {
		let min = 0;
		linedefs.forEach(ld => {
			min = Math.max(min, ld.start.x, ld.start.y, ld.end.x, ld.end.y);
		});
		return min;
	}

	mapX(x: number): number {
		return Math.round((x + Math.abs(this.minX)) / this.scale);
	}

	mapY(y: number): number {
		return Math.round((y + Math.abs(this.minY)) / this.scale);
	}

	// https://stackoverflow.com/questions/42881347/install-paper-js-and-typings-file-in-angular-2
	onPapertInit(project: Project): void {
		const wad: WadEntry = this.wadStorage.getCurrent().get();
		const map: WadMap = wad.wad.maps[3];

		this.minX = this.findMinX(map.linedefs);
		this.minY = this.findMinY(map.linedefs);
		const max = this.findMax(map.linedefs) + Math.max(Math.abs(this.minX), Math.abs(this.minY));
		this.scale = max / 1000;
		map.linedefs.forEach(ld => {
			const path = new Path({
				strokeColor: '#66ff00',
				strokeWidth: 2,
				strokeCap: 'round'
			});
			const sx = this.mapX(ld.start.x);
			const sy = this.mapY(ld.start.y);
			const ex = this.mapX(ld.end.x);
			const ey = this.mapY(ld.end.y);
			console.log('S:', sx, sy, 'E:', ex, ey);
			path.moveTo(new Point(sx, sy));
			path.lineTo(new Point(ex, ey));
			project.activeLayer.addChild(path);
		});

	}


}
