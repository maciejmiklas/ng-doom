import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import * as THREE from 'three';
import {Controls} from './controls';
import {WadStorageService} from '../../wad/wad-storage.service';
import {DoomMap, Linedef, PatchBitmap, Wad} from '../../wad/parser/wad-model';
import {functions as tp} from '../../wad/parser/texture-parser';
import {functions as ic} from '../../wad/parser/image-converter';

@Component({
	selector: 'app-play',
	templateUrl: './play.component.html',
	styleUrls: ['./play.component.css']
})
export class PlayComponent implements OnInit {

	mapId = 0;

	@ViewChild('canvas', {static: true})
	private canvasRef: ElementRef<HTMLCanvasElement>;
	private camera: THREE.PerspectiveCamera;
	private scene: THREE.Scene;
	private renderer: THREE.WebGLRenderer;
	private controls: Controls;
	private wad: Wad;

	constructor(private wadStorage: WadStorageService) {
	}

	private get canvas(): HTMLCanvasElement {
		return this.canvasRef.nativeElement;
	}

	ngOnInit(): void {
		this.wad = this.wadStorage.getCurrent().get().wad;
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
			comp.controls.render();
			comp.renderer.render(comp.scene, comp.camera);
		})();
	}

	private createWorld(scene: THREE.Scene) {
		const patch: PatchBitmap = this.wad.patches.find(p => p.header.dir.name === 'SW19_3');
		const map: DoomMap = this.wad.maps[this.mapId];
		const sectorRenderer = renderSector(scene, this.wad, patch);

		for (const sectorId in map.linedefsBySector) {
			sectorRenderer(parseInt(sectorId), map.linedefsBySector[sectorId]);
		}
		//scene.add(createGround());
	};
}

const renderSector = (scene: THREE.Scene, wad: Wad, patch: PatchBitmap) => (sectorId: number, linedefs: Linedef[]) => {
	const wallFactory = wall(wad);
	linedefs.forEach(ld => scene.add(wallFactory(ld, patch)));
};

const wall = (wad: Wad) => (ld: Linedef, patch: PatchBitmap): THREE.Mesh => {
	const vs = ld.start;
	const ve = ld.end;
	const wallWidth = Math.hypot(ve.x - vs.x, ve.y - vs.y);
	const wallHeight = 50;
	const patchData: Uint8ClampedArray = ic.patchToRGBA(patch)(wad.playpal.palettes[0]);
	const texture = new THREE.DataTexture(patchData, patch.header.width, patch.header.height);
	texture.needsUpdate = true;
	texture.format = THREE.RGBAFormat;
	texture.type = THREE.UnsignedByteType;
	texture.magFilter = THREE.NearestFilter;
	texture.minFilter = THREE.NearestFilter;
	texture.mapping = THREE.UVMapping;
	texture.wrapS = THREE.ClampToEdgeWrapping;
	texture.wrapT = THREE.ClampToEdgeWrapping;

	const material = new THREE.MeshBasicMaterial({map: texture, side: THREE.DoubleSide});
	const mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(wallWidth, wallHeight), material);
	mesh.position.set((vs.x + ve.x) / 2, wallHeight / 2, (vs.y + ve.y) / -2);
	mesh.rotateY(Math.atan2(ve.y - vs.y, ve.x - vs.x));
	return mesh;
};

const meshBasicTexture = (texture: THREE.Texture, width: number, height: number) => {
	const material = new THREE.MeshBasicMaterial({map: texture, side: THREE.DoubleSide});
	//material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
	//material.map.repeat.set(width, height);
	return (geometry: THREE.BufferGeometry): THREE.Mesh => new THREE.Mesh(geometry, material);
};

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
	const light = new THREE.HemisphereLight(0XFFFFCC, 0X19BBDC, 1.5);
	light.position.set(0, 0, 0);
	light.visible = true;
	scene.add(light);
	return scene;
};

const createCamera = (canvas: HTMLCanvasElement): THREE.PerspectiveCamera => {
	const cam = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 1, 20000);
	cam.position.set(1032, 500, 2170);
	//cam.position.set(1400, 10, 2800);
	return cam;
};

const createRenderer = (canvas: HTMLCanvasElement): THREE.WebGLRenderer => {
	const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
	renderer.physicallyCorrectLights = true;
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	renderer.setPixelRatio(window.devicePixelRatio);
	return renderer;
};


