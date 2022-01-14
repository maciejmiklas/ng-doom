import {Component, Input, OnInit} from '@angular/core';
import { PaperScope, Project, Path, Point } from 'paper';
@Component({
  selector: 'app-paper',
  templateUrl: './paper.component.html',
  styleUrls: ['./paper.component.css']
})
export class PaperComponent implements OnInit {

	@Input()
	width = 800;

	@Input()
	height = 800;

	constructor() { }

  ngOnInit(): void {
  }

}
