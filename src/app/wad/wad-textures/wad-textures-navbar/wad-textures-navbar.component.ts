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
import {TexturesListControl} from '../wad-textures.component'
import {NavbarPlugin} from '../../../main/navbar_plugin'
import {FormsModule, ReactiveFormsModule} from '@angular/forms'

@Component({
    selector: 'app-wad-textures-navbar',
    templateUrl: './wad-textures-navbar.component.html',
    standalone: true,
    imports: [ReactiveFormsModule, FormsModule]
})
export class WadTexturesNavbarComponent implements NavbarPlugin<TexturesListControl> {

	private data: TexturesListControl

	setData(data: TexturesListControl): void {
		this.data = data
	}

	set filter(val: string) {
		this.data.applyFilter(val)
	}

	get filter(): string {
		return ''
	}

}
