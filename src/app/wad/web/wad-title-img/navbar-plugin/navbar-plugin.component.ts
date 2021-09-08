import {Component} from '@angular/core';
import {NavbarPlugin} from '../../../../navbar/service/navbar_plugin';
import {WadTitleImgComponent} from '../wad-title-img.component';

@Component({
	selector: 'app-navbar-plugin',
	templateUrl: './navbar-plugin.component.html',
	styleUrls: ['./navbar-plugin.component.scss'],
})
export class NavbarPluginComponent implements NavbarPlugin<WadTitleImgComponent> {
	_zoom = 2;
	private comp: WadTitleImgComponent;
	formatter = (value) => {
		return 'x ' + value;
	}

	setData(data: WadTitleImgComponent): void {
		this.comp = data;
	}

	set zoom(zoom: number) {
		this._zoom = zoom;
		this.comp.scale = zoom;
	}

	get zoom(): number {
		return this._zoom;
	}

}
