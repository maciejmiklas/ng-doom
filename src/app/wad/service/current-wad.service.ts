import {Injectable} from '@angular/core';
import {functions as wp} from '../parser/wad_parser';
import {Wad} from '../wad_structure_model';
import {Either} from '../../common/is/either';

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
