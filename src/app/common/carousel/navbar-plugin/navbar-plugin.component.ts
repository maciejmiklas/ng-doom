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
import {Component, ViewEncapsulation} from '@angular/core'
import {NavbarPlugin} from '../../../main/navbar_plugin'
import {CarouselControl} from '../carousel.component'

@Component({
	selector: 'app-wad-map-navbar',
	templateUrl: './navbar-plugin.component.html',
	styleUrls: ['./navbar-plugin.component.scss'],
})
export class NavbarCarouselPluginComponent implements NavbarPlugin<CarouselControl> {

	control: CarouselControl

	zoomFormatter = (value) => {
		return 'x ' + value
	}

	pauseClass(): string {
		return this.control.zoomVisible() ? 'col-1' : 'col-4'
	}

	setData(carouselControl: CarouselControl): void {
		this.control = carouselControl
	}

	set zoom(zoom: number) {
		this.control.setZoom(zoom)
	}

	get zoom(): number {
		return this.control.getZoom()
	}

	togglePaused(): void {
		this.control.togglePaused()
	}

}
