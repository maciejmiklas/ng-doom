/*
 * Copyright 2022 Maciej Miklas (MIT License)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import {Component} from '@angular/core'
import {NavbarPlugin} from '../../../main/navbar_plugin'
import {MapControl} from '../wad-map.component'
import {NgxBootstrapSliderModule} from '@maciejmiklas/ngx-bootstrap-slider'
import {ReactiveFormsModule} from '@angular/forms'
import {NgFor} from '@angular/common'
import {NgbDropdown} from '@ng-bootstrap/ng-bootstrap'

@Component({
    selector: 'app-wad-map-navbar',
    templateUrl: './wad-map-navbar.component.html',
    standalone: true,
    imports: [NgbDropdown, NgFor, ReactiveFormsModule, NgxBootstrapSliderModule]
})
export class WadMapNavbarComponent implements NavbarPlugin<MapControl> {

	private _zoom = 1
	control: MapControl
	maps: string[]

	set zoom(zoom: number) {
		this._zoom = zoom
		this.control.onZoomChange(zoom)
	}

	get zoom(): number {
		return this._zoom
	}

	setData(control: MapControl): void {
		this.control = control
		this.maps = control.mapNames()
	}

	zoomFormatter = (value) => {
		return 'x ' + value
	}

	onMapSelect(name: string): void {
		this.control.onMapChange(name)
	}


}
