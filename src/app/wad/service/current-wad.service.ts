import {Injectable} from '@angular/core';
import {functions as wp} from '../parser/wad_parser';
import {Wad} from '../parser/wad_model';
import {Either} from '../../common/is/either';
import {EmitEvent, NgRxEventBusService} from 'ngrx-event-bus';
import {Events} from '../../common/is/Events';

@Injectable({
	providedIn: 'root'
})
export class CurrentWadService {

	public bytes: number[];
	public wad: Wad;

	constructor(private eventBus: NgRxEventBusService) {
	}

	public load(wadBuf: ArrayLike<number> | ArrayBufferLike): void {
		this.bytes = Either.ofRight(Array.from(new Uint8Array(wadBuf))).get();
		this.wad = wp.parseWad(this.bytes).get();
		this.eventBus.emit(new EmitEvent(Events.WAD_UPLOADED));
	}

	public isLoaded(): boolean {
		console.log('LOADED: ', (this.wad !== undefined));
		return this.wad !== undefined;
	}

}
