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
		const mesh = meshTexture(brickTexture);

		linedefs.forEach(ld => {
			scene.add(wall(ld.start, ld.end, mesh));
		});
		//scene.add(createGround());

		/*

		wall({x: 1376, y: -3200}, {x: 1376, y: -3104}, mesh, '1.5707963267948966 -1376 204 -3152');
		wall({x: 1376, y: -3360}, {x: 1376, y: -3264}, mesh, '1.5707963267948966 -1376 204 -3312');
		wall({x: 1856, y: -2880}, {x: 1920, y: -2920}, mesh, '-0.5585993153435624 -1888 108 -2900');
		wall({x: 2736, y: -3112}, {x: 2736, y: -3360}, mesh, '-1.5707963267948966 -2736 176 -3236');
		wall({x: 1376, y: -3520}, {x: 1376, y: -3392}, mesh, '1.5707963267948966 -1376 108 -3456');
		wall({x: 2048, y: -3872}, {x: 2176, y: -3872}, mesh, '0 -2112 16 -3872');
		wall({x: 2176, y: -3680}, {x: 2048, y: -3680}, mesh, '3.141592653589793 -2112 40 -3680');
		wall({x: 1664, y: -2112}, {x: 2496, y: -2112}, mesh, '0 -2080 156 -2112');
		wall({x: 1784, y: -2552}, {x: 1784, y: -2632}, mesh, '-1.5707963267948966 -1784 224 -2592');
		wall({x: 1792, y: -2304}, {x: 1984, y: -2304}, mesh, '0 -1888 160 -2304');
		wall({x: 256, y: -3136}, {x: 320, y: -3136}, mesh, '0 -288 204 -3136');
		wall({x: -208, y: -3264}, {x: -192, y: -3248}, mesh, '0.7853981633974483 200 264 -3256');
		wall({x: 3328, y: -3968}, {x: 3328, y: -3744}, mesh, '1.5707963267948966 -3328 68 -3856');
*/
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
	scene.add(new THREE.AxesHelper(500).setColors(new THREE.Color('red'), new THREE.Color('black'), new THREE.Color('green')));
	scene.add(new THREE.HemisphereLight(0xffffcc, 0x19bbdc, 2.5));
	return scene;
};

const createCamera = (canvas: HTMLCanvasElement): THREE.PerspectiveCamera => {
	const cam = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, -1000, 2000);
	cam.position.set(0, 2000, 2000);
	return cam;
};

const createRenderer = (canvas: HTMLCanvasElement): THREE.WebGLRenderer => {
	const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
	renderer.physicallyCorrectLights = true;
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	renderer.setPixelRatio(window.devicePixelRatio);
	return renderer;
};

const wall = (vs: Vertex, ve: Vertex, meshFunction, text?: string): THREE.Mesh => {
	const height = 50;
	const thickness = 5;
	const width = Math.hypot(ve.x - vs.x, ve.y - vs.y);

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
	mesh.position.set(vs.x , 0, -vs.y);
	mesh.rotateY(Math.atan2(ve.y - vs.y, ve.x - vs.x));
	return mesh;
};
