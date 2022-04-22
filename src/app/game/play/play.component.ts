import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import * as THREE from 'three';
import {Controls} from './controls';
import {WadStorageService} from '../../wad/wad-storage.service';
import {Linedef, Vertex} from '../../wad/parser/wad-model';

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
	private controls: Controls;

	constructor(private wadStorage: WadStorageService) {
	}

	private get canvas(): HTMLCanvasElement {
		return this.canvasRef.nativeElement;
	}

	ngOnInit(): void {
		this.camera = createCamera(this.canvas);
		this.scene = createScene();
		this.renderer = createRenderer(this.canvas);
		this.createWorld(this.scene);

		this.camera.lookAt(this.scene.position);

		this.controls = new Controls(this.camera, this.canvas);
		this.startRenderingLoop();
	}

	private startRenderingLoop(): void {
		const comp = this;
		(function render() {
			requestAnimationFrame(render);
			comp.controls.onRender();
			comp.renderer.render(comp.scene, comp.camera);
		})();
	}

	private createWorld(scene: THREE.Scene) {
		const brickTexture = createTexture('../../../assets/textures/brick.jpg');
		const linedefs: Linedef[] = this.wadStorage.getCurrent().get().wad.maps[0].linedefs;
		const mesh = meshPhongTexture(brickTexture);
		//scene.add(wall({x: 0, y: 0}, {x: 1000, y: 0}, mesh));

		linedefs.forEach(ld => {
			scene.add(wall(ld.start, ld.end, mesh));
		});
		//scene.add(createGround());
	};
}

const createGround = () => {
	const groundTexture = createTexture('../../../assets/textures/dirt.jpg');
	groundTexture.repeat.set(100, 100);
	const groundDimension = 400;
	const ground = meshPhongTexture(groundTexture)(new THREE.PlaneBufferGeometry(groundDimension, groundDimension));
	ground.rotateX(-Math.PI / 2);
	ground.position.z = -groundDimension / 2;
	ground.position.x = groundDimension / 2;
	return ground;
};

const meshColor = (color: string) => (geometry: THREE.BufferGeometry): THREE.Mesh => new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({color}));

const meshBasicTexture = (texture: THREE.Texture) => (geometry: THREE.BufferGeometry): THREE.Mesh =>
	new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({map: texture}));

const meshPhongTexture = (texture: THREE.Texture) => (geometry: THREE.BufferGeometry): THREE.Mesh =>
	new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({map: texture, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide}));

const createTexture = (path: string): THREE.Texture => {
	const texture: THREE.Texture = new THREE.TextureLoader().load(path);
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	return texture;
};

const createScene = (): THREE.Scene => {
	const scene = new THREE.Scene();
	scene.background = new THREE.Color('skyblue');
	scene.add(new THREE.AxesHelper(500).setColors(new THREE.Color('red'), new THREE.Color('black'), new THREE.Color('green')));
	const light = new THREE.HemisphereLight(0xffffcc, 0x19bbdc, 1.5);
	light.position.set(0, 0, 0);
	light.visible = true;
	scene.add(light);
	return scene;
};

const createCamera = (canvas: HTMLCanvasElement): THREE.PerspectiveCamera => {
	const cam = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 1, 20000);
	//cam.position.set(0, 2000, 2000);
	cam.position.set(1400, 10, 2800);
	//cam.position.set(50, 50, 50);
	return cam;
};

const createRenderer = (canvas: HTMLCanvasElement): THREE.WebGLRenderer => {
	const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
	renderer.physicallyCorrectLights = true;
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	renderer.setPixelRatio(window.devicePixelRatio);
	return renderer;
};

const wall = (vs: Vertex, ve: Vertex, meshFn: (geometry: THREE.BufferGeometry) => THREE.Mesh): THREE.Mesh => {
	const height = 50;
	const width = Math.hypot(ve.x - vs.x, ve.y - vs.y);
	const mesh = meshFn(new THREE.PlaneGeometry(width, height));
	mesh.position.set((vs.x + ve.x) / 2, height / 2, (vs.y + ve.y) / -2);
	mesh.rotateY(Math.atan2(ve.y - vs.y, ve.x - vs.x));
	return mesh;
};
