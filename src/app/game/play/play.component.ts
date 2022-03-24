import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import * as THREE from 'three';
import {Controls} from './controls';
import {WadStorageService} from '../../wad/wad-storage.service';
import {Linedef} from '../../wad/parser/wad-model';
import {functions as mp} from '../../wad/parser/map-parser';

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
		//simpleWall(scene);
		const brickTexture = createTexture('../../../assets/textures/brick.jpg');
		const linedefsOrg: Linedef[] = this.wadStorage.getCurrent().get().wad.maps[0].linedefs;
		const linedefs = mp.normalizeLinedefs(12)(linedefsOrg);
		const mesh = meshTexture(brickTexture);
		linedefs.forEach(ld=> {
			scene.add(wall(ld.start.x, ld.start.y, ld.end.x, ld.end.y, mesh))
		})
		scene.add(createGround());
	};
}

const createGround = () => {
	const groundTexture = createTexture('../../../assets/textures/dirt.jpg');
	groundTexture.repeat.set(100, 100);
	const groundDimension = 400;
	const ground = meshTexture(groundTexture)(new THREE.PlaneBufferGeometry(groundDimension, groundDimension));
	ground.rotateX(-Math.PI / 2);
	ground.position.z = -groundDimension / 2;
	ground.position.x = groundDimension / 2;
	return ground;
};

const meshColor = (color: string) => (geometry: THREE.BufferGeometry): THREE.Mesh => new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({color}));

const meshTexture = (texture: THREE.Texture) => (geometry: THREE.BufferGeometry): THREE.Mesh =>
	new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({map: texture}));

const createTexture = (path: string): THREE.Texture => {
	const texture = new THREE.TextureLoader().load(path);
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	return texture;
};

const createScene = (): THREE.Scene => {
	const scene = new THREE.Scene();
	scene.background = new THREE.Color('skyblue');
	scene.add(new THREE.AxesHelper(500));
	scene.add(new THREE.HemisphereLight(0xffffcc, 0x19bbdc, 2.5));
	return scene;
};

const createCamera = (canvas: HTMLCanvasElement): THREE.PerspectiveCamera => {
	const cam = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 10000);
	cam.position.set(350, 1, -100);
	return cam;
};

const createRenderer = (canvas: HTMLCanvasElement): THREE.WebGLRenderer => {
	const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
	renderer.physicallyCorrectLights = true;
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	renderer.setPixelRatio(window.devicePixelRatio);
	return renderer;
};

const wall = (x1: number, y1: number, x2: number, y2: number, meshFunction): THREE.Mesh => {
	const height = 3;
	const thickness = 0.5;
	const width = Math.hypot(x2 - x1, y2 - y1);

	const shape = new THREE.Shape();
	shape.moveTo(0, 0);
	shape.lineTo(width, 0);
	shape.lineTo(width, height);
	shape.lineTo(0, height);
	shape.lineTo(0, 0);
	const tiltWallGeometry = new THREE.ExtrudeBufferGeometry([shape], {
		depth: thickness,
		bevelEnabled: false,
	});

	const mesh = meshFunction(tiltWallGeometry);
	mesh.position.x = x1;
	mesh.position.y = 0;
	mesh.position.z = -y1;

	let angle = Math.atan2(y2 - y1, x2 - x1);
	mesh.rotateY(angle);
	return mesh;
};

const simpleWall = (group: THREE.Scene): void => {
	group.add(wall(0, 0, 1, 2, meshColor('green')));
	group.add(wall(1, 2, 1, 4, meshColor('green')));
	group.add(wall(1, 4, 3, 4, meshColor('green')));
	group.add(wall(3, 4, 4, 5, meshColor('green')));
	group.add(wall(4, 5, 5, 4, meshColor('green')));
	group.add(wall(5, 4, 9, 2, meshColor('green')));
	group.add(wall(9, 2, 6, 2, meshColor('violet')));
	group.add(wall(6, 2, 6, 1, meshColor('red')));
	group.add(wall(6, 1, 5, 1, meshColor('blue')));
	group.add(wall(5, 1, 5, 2, meshColor('red')));
	group.add(wall(5, 2, 3, 2, meshColor('orange')));
	group.add(wall(3, 2, 4, 0, meshColor('yellow')));
	group.add(wall(4, 0, 0, 0, meshColor('black')));
};
