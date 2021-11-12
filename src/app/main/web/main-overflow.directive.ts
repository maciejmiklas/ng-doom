import {Directive, ElementRef} from '@angular/core';
import {NgRxEventBusService} from 'ngrx-event-bus';
import {MainEvent} from '../service/main-event';

@Directive({
	selector: '[appMainOverflow]'
})
export class MainOverflowDirective {

	constructor(el: ElementRef, private eventBus: NgRxEventBusService) {
		el.nativeElement.style.overflowX = 'visible';

		this.eventBus.on(MainEvent.SET_MAIN_OVERFLOW, (val: string) => {
			el.nativeElement.style.overflowX = val;
		});
	}

}
