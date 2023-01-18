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
import {IEvent} from 'ngrx-event-bus'

export class MainEvent implements IEvent {
	/** Event Data: NavbarPluginFactory */
	public static SET_NAVBAR_PLUGIN = 'SET_NAVBAR_PLUGIN'

	/** Event Data: value for x-overflow on .app-main */
	public static SET_MAIN_OVERFLOW = 'SET_MAIN_OVERFLOW'
}