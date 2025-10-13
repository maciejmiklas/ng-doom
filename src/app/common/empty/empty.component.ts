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
import {Component} from '@angular/core'

@Component({
	selector: 'app-empty',
	template: `
		<div class="bd-example-row">
			<div class="container-fluid">
				<!-- Stack the columns on mobile by making one full-width and the other half-width -->
				<div class="row">
					<div class="col-md-8">R1 .col-md-8</div>
					<div class="col-6 col-md-4">R1 .col-6 .col-md-4</div>
				</div>

				<!-- Columns start at 50% wide on mobile and bump up to 33.3% wide on desktop -->
				<div class="row">
					<div class="col-6 col-md-4">R2 .col-6 .col-md-4</div>
					<div class="col-6 col-md-4">R2 .col-6 .col-md-4</div>
					<div class="col-6 col-md-4">R2 .col-6 .col-md-4</div>
				</div>

				<!-- Columns are always 50% wide, on mobile and desktop -->
				<div class="row">
					<div class="col-6">R3 .col-6</div>
					<div class="col-6">R3 .col-6</div>
				</div>
			</div>
		</div>

	`,
	standalone: true
})
export class EmptyComponent {

}
