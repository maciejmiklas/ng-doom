import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import * as THREE from 'three';

@Component({
	selector: 'app-play',
	templateUrl: './play.component.html',
	styleUrls: ['./play.component.css']
})
export class PlayComponent implements OnInit {

	@ViewChild('canvas', {static: true})
	private canvasRef: ElementRef<HTMLCanvasElement>;

	private camera: THREE.PerspectiveCamera;
	private scene: THREE.Scene;
	private renderer: THREE.WebGLRenderer;

	constructor() {
	}

	private get canvas(): HTMLCanvasElement {
		return this.canvasRef.nativeElement;
	}

	ngOnInit(): void {
		this.canvas.getBoundingClientRect();
		this.camera = this.createCamera(this.canvas);
		this.scene = this.createScene();
		this.renderer = this.createRenderer(this.canvas);
	}

	private createCamera(canvas: HTMLCanvasElement): THREE.PerspectiveCamera {
		const cam = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 10000);
		cam.position.set(350, 1, -100);
		return cam;
	}

	private createScene(): THREE.Scene {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color('skyblue');
		scene.add(new THREE.HemisphereLight(0xffffcc, 0x19bbdc, 2.5));
		return scene;
	}

	private createRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
		const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
		renderer.physicallyCorrectLights = true;
		renderer.setSize(canvas.clientWidth, canvas.clientHeight);
		renderer.setPixelRatio(window.devicePixelRatio);
		return renderer;
	}

}
