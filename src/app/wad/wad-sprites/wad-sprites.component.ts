import {Component, OnInit} from '@angular/core';
import {WadStorageService} from '../wad-storage.service';
import {functions as sp} from '../parser/sprite-parser';
import {functions as ic} from '../parser/image-converter';
import {BitmapSprite, Palette} from '../parser/wad-model';
import {functions as bp} from '../parser/bitmap-parser';
import {EmitEvent, NgRxEventBusService} from 'ngrx-event-bus';
import {MainEvent} from '../../main/service/main-event';
import {NavbarPluginFactory} from '../../main/service/navbar_plugin';
import {WadSpritesNavbarComponent} from './wad-sprites-navbar/wad-sprites-navbar.component';

@Component({
	selector: 'app-wad-sprite',
	templateUrl: './wad-sprites.component.html',
	styleUrls: ['./wad-sprites.component.scss']
})
export class WadSpritesComponent implements OnInit, SpritesListControl {

	sprites: BitmapSprite[][];
	scale: number[];
	palette: Palette;
	private readonly ZOOM_MAX_SIZE = 150; // box has 200px, it's set in .app-sprite

	constructor(private wadStorage: WadStorageService, private eventBus: NgRxEventBusService) {
	}

	ngOnInit(): void {
		const wad = this.wadStorage.getCurrent().get().wad;
		this.sprites = this.readSprites(() => true);
		this.scale = this.sprites.map(s => s[0]).map(ic.calcScale(this.ZOOM_MAX_SIZE));
		this.palette = bp.parsePlaypal(wad.bytes, wad.dirs).palettes[0];
		this.eventBus.emit(new EmitEvent(MainEvent.SET_NAVBAR_PLUGIN, new NavbarPluginFactory(WadSpritesNavbarComponent, this)));
	}

	applyFilter(filter: string) {
		this.sprites = this.readSprites(s => s.name.toLowerCase().includes(filter.toLowerCase()));
	}

	private readSprites(filterSprite: (Sprite) => boolean): BitmapSprite[][] {
		const wad = this.wadStorage.getCurrent().get().wad;
		return sp
			.parseSpritesAsArray(wad.bytes, wad.dirs) // (bytes[])=>Sprite[]
			.filter(s => filterSprite(s)) // (Sprite)=>boolean
			.map(ic.toBitmapSprites) // (Sprite) => Either<BitmapSprite[]>
			.filter(s => s.isRight()).map(s => s.get());
	}
}

export interface SpritesListControl {
	applyFilter(filter: string);
}



