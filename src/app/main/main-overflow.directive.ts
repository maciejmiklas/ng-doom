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
import {Directive, ElementRef} from '@angular/core'
import {NgRxEventBusService} from 'ngrx-event-bus'
import {MainEvent} from './main-event'

@Directive({
	selector: '[appMainOverflow]'
})
export class MainOverflowDirective {

	constructor(el: ElementRef, private eventBus: NgRxEventBusService) {
		el.nativeElement.style.overflowX = 'visible'

		this.eventBus.on(MainEvent.SET_MAIN_OVERFLOW, (val: string) => {
			el.nativeElement.style.overflowX = val
		})
	}

}