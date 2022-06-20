/*
 * Copyright 2022 Maciej Miklas
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
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
import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import * as THREE from 'three';
import {Controls} from './controls';
import {WadStorageService} from '../../wad/wad-storage.service';
import {Bitmap, DoomMap, DoomTexture, Linedef, LinedefBySector, Wad} from '../../wad/parser/wad-model';
import {CSS2DRenderer} from 'three/examples/jsm/renderers/CSS2DRenderer';
import {Either} from '@maciejmiklas/functional-ts';
import {Side} from 'three/src/constants';

@Component({
	selector: 'app-play',
	templateUrl: './play.component.html',
	styleUrls: ['./play.component.css']
})
export class PlayComponent implements OnInit {

	mapId = 4;

	@ViewChild('canvas', {static: true})
	private canvasRef: ElementRef<HTMLCanvasElement>;
	private camera: THREE.PerspectiveCamera;
	private scene: THREE.Scene;
	private webGLRenderer: THREE.WebGLRenderer;
	private labelRenderer: CSS2DRenderer;
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
		this.webGLRenderer = createWebGlRenderer(this.canvas);
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
			comp.webGLRenderer.render(comp.scene, comp.camera);
			if (comp.labelRenderer) {
				comp.labelRenderer.render(comp.scene, comp.camera);
			}
		})();
	}

	private createWorld(scene: THREE.Scene) {
		const startTime = performance.now();
		const map: DoomMap = this.wad.maps[this.mapId];
		map.linedefBySector.forEach(renderSector(scene));

		//scene.add(createGround());
		console.log('>TIME createWorld>', performance.now() - startTime);
	};
}

const renderSector = (scene: THREE.Scene) => (lbs: LinedefBySector) => {
	lbs.linedefs.forEach(ld => {
		middleWall(ld, THREE.FrontSide, () => ld.frontSide.middleTexture).exec(m => scene.add(m));
		middleWall(ld, THREE.BackSide, () => ld.backSide.map(b => b.middleTexture)).exec(m => scene.add(m));
		upperWall(ld).exec(m => scene.add(m));
		lowerWall(ld).exec(m => scene.add(m));
	});
};

const lowerWall = (ld: Linedef): Either<THREE.Mesh> => {
	return Either.ofTruthFlat([ld.frontSide.lowerTexture, ld.backSide], () =>
		ld.frontSide.lowerTexture.map(tx => {
			const vs = ld.start;
			const ve = ld.end;
			const secFloorHeight = ld.backSide.get().sector.floorHeight;
			const wallWidth = Math.hypot(ve.x - vs.x, ve.y - vs.y);
			const wallHeight = ld.sector.floorHeight - secFloorHeight;
			const material = createMaterial(tx, THREE.FrontSide);
			const mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(wallWidth, wallHeight), material);
			mesh.position.set((vs.x + ve.x) / 2, secFloorHeight + wallHeight / 2, (vs.y + ve.y) / -2);
			mesh.rotateY(Math.atan2(ve.y - vs.y, ve.x - vs.x));
			return mesh;
		}));
};

const upperWall = (ld: Linedef): Either<THREE.Mesh> => {
	return Either.ofTruthFlat([ld.frontSide.upperTexture, ld.backSide], () =>
		ld.frontSide.upperTexture.map(tx => {
			const vs = ld.start;
			const ve = ld.end;
			const secCeilingHeight = ld.backSide.get().sector.ceilingHeight;
			const wallWidth = Math.hypot(ve.x - vs.x, ve.y - vs.y);
			const wallHeight = ld.sector.ceilingHeight - secCeilingHeight;
			const material = createMaterial(tx, THREE.FrontSide);
			const mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(wallWidth, wallHeight), material);
			mesh.position.set((vs.x + ve.x) / 2, secCeilingHeight + wallHeight / 2, (vs.y + ve.y) / -2);
			mesh.rotateY(Math.atan2(ve.y - vs.y, ve.x - vs.x));
			return mesh;
		}));
};

const middleWall = (ld: Linedef, side: Side, textureExtractor: () => Either<DoomTexture>): Either<THREE.Mesh> => {
	return textureExtractor().map(tx => {
		const vs = ld.start;
		const ve = ld.end;
		const wallWidth = Math.hypot(ve.x - vs.x, ve.y - vs.y);
		const wallHeight = ld.sector.ceilingHeight - ld.sector.floorHeight;
		const material = createMaterial(tx, side);
		const mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(wallWidth, wallHeight), material);
		mesh.position.set((vs.x + ve.x) / 2, ld.sector.floorHeight + wallHeight / 2, (vs.y + ve.y) / -2);
		mesh.rotateY(Math.atan2(ve.y - vs.y, ve.x - vs.x));
		return mesh;
	});
};

const createMaterial = (dt: DoomTexture, side: Side, color = null): THREE.Material => {
	let material;
	if (dt) {
		const patch: Bitmap = dt.patches[0].bitmap;
		const texture = new THREE.DataTexture(patch.rgba, patch.header.width, patch.header.height);
		texture.needsUpdate = true;
		texture.format = THREE.RGBAFormat;
		texture.type = THREE.UnsignedByteType;
		texture.magFilter = THREE.NearestFilter;
		texture.minFilter = THREE.NearestFilter;
		texture.mapping = THREE.UVMapping;
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		side = THREE.DoubleSide;// TODO remove for real game
		material = new THREE.MeshBasicMaterial({map: texture, transparent: true, alphaTest: 0.5, side, color});
	} else {
		material = new THREE.MeshStandardMaterial({transparent: true, color: 'green', side: THREE.DoubleSide});
	}
	return material;
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
	//cam.position.set(1400, 50, 2800);
	return cam;
};

const createWebGlRenderer = (canvas: HTMLCanvasElement): THREE.WebGLRenderer => {
	const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
	renderer.physicallyCorrectLights = true;
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	renderer.setPixelRatio(window.devicePixelRatio);
	return renderer;
};




