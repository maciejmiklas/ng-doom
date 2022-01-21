import {Component, ElementRef, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import {PaperScope, Point} from 'paper';

@Component({
	selector: 'app-paper',
	templateUrl: './paper.component.html',
	styleUrls: ['./paper.component.css']
})
export class PaperComponent implements OnInit {

	@ViewChild('canvas', {static: true})
	private canvasRef: ElementRef<HTMLCanvasElement>;
	private canvas: HTMLCanvasElement;

	@Output()
	private paperInitialized = new EventEmitter<paper.PaperScope>();

	@Output()
	private mouseDrag = new EventEmitter<paper.Point>();

	@Output()
	private mouseDragEnd = new EventEmitter<paper.Point>();

	private mouseDown = false;
	private scope: paper.PaperScope;

	constructor() {
	}

	private getMousePosition(event: MouseEvent): paper.Point {
		const rect = this.canvas.getBoundingClientRect();
		return new Point(event.clientX - rect.x, event.clientY - rect.y);
	}

	ngOnInit(): void {
		this.canvas = this.canvasRef.nativeElement;
		this.scope = new PaperScope();
		this.scope.setup(this.canvas);
		this.paperInitialized.emit(this.scope);

		this.canvas.addEventListener('mousedown', () => {
			this.mouseDown = true;
		});

		this.canvas.addEventListener('mousemove', (event: MouseEvent) => {
			if (this.mouseDown) {
				this.mouseDrag.emit(this.getMousePosition(event));
			}
		});

		this.canvas.addEventListener('mouseup', (event: MouseEvent) => {
			this.mouseDown = false;
			this.mouseDragEnd.emit(this.getMousePosition(event));
		});
	}

}
