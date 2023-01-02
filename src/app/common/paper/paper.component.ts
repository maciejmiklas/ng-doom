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
import {Component, ElementRef, EventEmitter, OnInit, Output, ViewChild} from '@angular/core'
import {PaperScope, Point} from 'paper'

@Component({
	selector: 'app-paper',
	templateUrl: './paper.component.html',
	styleUrls: ['./paper.component.css']
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
