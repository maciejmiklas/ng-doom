/*
 * Copyright 2025 Maciej Miklas (MIT License)
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
import {Component, EventEmitter, Input, Output, signal, ViewEncapsulation, WritableSignal} from '@angular/core'
import {ReactiveFormsModule} from '@angular/forms'
import {MatFormField, MatLabel, MatOption, MatSelect} from '@angular/material/select';

@Component({
  selector: 'app-wad-map-navbar',
  styleUrl: './wad-map-navbar.component.scss',
  template: `
    <mat-form-field>
      <mat-label>Map</mat-label>
      <mat-select [value]="mapNames[0]" (selectionChange)="onMapSelect($event.value)">
        @for (map of mapNames; track map) {
          <mat-option [value]="map">{{ map }}</mat-option>
        }
      </mat-select>
    </mat-form-field>

    <!--
    <mv-slider [(value)]="zoom" [min]="1" [max]="8" [step]="1" [formatter]="zoomFormatter"
    tooltipPosition="bottom"></mv-slider>
    -->
  `,
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [ReactiveFormsModule, MatSelect, MatOption, MatSelect, MatSelect, MatOption, MatFormField, MatLabel]
})
export class WadMapNavbarComponent {

  @Input() mapNames: string[]
  @Output() mapChange: EventEmitter<string> = new EventEmitter<string>();
  @Output() zoomChange: EventEmitter<number> = new EventEmitter<number>();

  private _zoom = 1
  maps: WritableSignal<string[]> = signal([])

  set zoom(zoom: number) {
    this._zoom = zoom
    // this.control.onZoomChange(zoom)
  }

  get zoom(): number {
    return this._zoom
  }

  zoomFormatter = (value) => {
    return 'x ' + value
  }

  onMapSelect(name: string): void {
    this.mapChange.emit(name)
  }

}
