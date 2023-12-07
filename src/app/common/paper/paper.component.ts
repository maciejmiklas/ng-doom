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
import {Component, ElementRef, EventEmitter, OnInit, Output, ViewChild} from '@angular/core'
import {PaperScope, Point} from 'paper'

@Component({
    selector: 'app-paper',
    templateUrl: './paper.component.html',
    standalone: true
})
export class PaperComponent implements OnInit {

	@ViewChild('canvas', {static: true})
	private canvasRef: ElementRef<HTMLCanvasElement>

	@Output()
	private paperInitialized = new EventEmitter<paper.PaperScope>()

	@Output()
	private mouseDrag = new EventEmitter<paper.Point>()

	@Output()
	private mouseDragEnd = new EventEmitter<paper.Point>()

	private mouseDown = false
	private scope: paper.PaperScope

	private get canvas(): HTMLCanvasElement {
		return this.canvasRef.nativeElement
	}

	private getMousePosition(event: MouseEvent): paper.Point {
		const rect = this.canvas.getBoundingClientRect()
		return new Point(event.clientX - rect.x, event.clientY - rect.y)
	}

	ngOnInit(): void {
		this.scope = new PaperScope()
		this.scope.setup(this.canvas)
		this.paperInitialized.emit(this.scope)

		this.canvas.addEventListener('mousedown', () => {
			this.mouseDown = true
		})

		this.canvas.addEventListener('mousemove', (event: MouseEvent) => {
			if (this.mouseDown) {
				this.mouseDrag.emit(this.getMousePosition(event))
			}
		})

		this.canvas.addEventListener('mouseup', (event: MouseEvent) => {
			this.mouseDown = false
			this.mouseDragEnd.emit(this.getMousePosition(event))
		})
	}

}
