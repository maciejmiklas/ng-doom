import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {PaperScope, Project} from 'paper';

@Component({
	selector: 'app-paper',
	templateUrl: './paper.component.html',
	styleUrls: ['./paper.component.css']
})
// http://paperjs.org/tutorials/getting-started/working-with-paper-js
export class PaperComponent implements OnInit {

	@Input()
	width = 800;

	@Input()
	height = 600;

	@ViewChild('canvas', {static: true})
	canvasRef: ElementRef<HTMLCanvasElement>;

	@Output()
	project = new EventEmitter<paper.Project>();

	scope: paper.PaperScope;
	projectRef: paper.Project;

	constructor() {
	}

	ngOnInit(): void {
		this.scope = new PaperScope();
		this.projectRef = new Project('cv');
		this.project.emit(this.projectRef);
	}

}
