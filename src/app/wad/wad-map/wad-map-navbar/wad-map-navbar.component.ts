import {Component} from '@angular/core'
import {NavbarPlugin} from '../../../main/service/navbar_plugin'
import {MapControl} from '../wad-map.component'

@Component({
	selector: 'app-wad-map-navbar',
	templateUrl: './wad-map-navbar.component.html',
	styleUrls: ['./wad-map-navbar.component.css']
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
