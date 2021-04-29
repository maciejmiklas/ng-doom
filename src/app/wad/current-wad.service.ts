import {Injectable} from '@angular/core';
import {functions as wp} from './wad_parser';
import {Wad} from './wad_model';
import {Either} from '../common/either';

@Injectable({
	providedIn: 'root'
})
export class CurrentWadService {

	public bytes: number[];
	public wad: Wad;

	constructor() {
	}

	public load(wadBuf: ArrayLike<number> | ArrayBufferLike): void {
		this.bytes = Either.ofRight(Array.from(new Uint8Array(wadBuf))).get();
		this.wad = wp.parseWad(this.bytes).get();
	}

	public isLoaded(): boolean {
		return this.wad !== undefined;
	}

}
