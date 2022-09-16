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
import {Controls} from '../controls';
import {WadStorageService} from '../../wad/wad-storage.service';
import {
	DoomMap,
	DoomTexture,
	functions as mf,
	Linedef,
	LinedefBySector,
	ThingType,
	Wad
} from '../../wad/parser/wad-model';

import {functions as tm} from '../three-mapper'
import {CSS2DRenderer} from 'three/examples/jsm/renderers/CSS2DRenderer';
import {Either} from '../../common/either';
import {Side} from 'three/src/constants';


const pointer = new THREE.Vector2();

function onPointerMove(event) {
	pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
	pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
	console.log('P', JSON.stringify(pointer));
}

@Component({
	selector: 'app-play',
	templateUrl: './play.component.html',
	styleUrls: ['./play.component.css']
})
export class PlayComponent implements OnInit {

	mapId = 1;

	@ViewChild('canvas', {static: true})
	private canvasRef: ElementRef<HTMLCanvasElement>;
	private camera: THREE.PerspectiveCamera;
	private scene: THREE.Scene;
	private webGLRenderer: THREE.WebGLRenderer;
	private labelRenderer: CSS2DRenderer;
	private controls: Controls;
	private wad: Wad;
	private map: DoomMap;
	private floors: THREE.Mesh[] = []
	private raycaster = new THREE.Raycaster();

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
		this.map = this.wad.maps[this.mapId];
		this.createWorld(this.scene, this.map);
		setupCamera(this.camera, this.map);
		this.camera.lookAt(this.scene.position);
		this.controls = new Controls(this.camera, this.canvas);
		this.startRenderingLoop();
		window.addEventListener('pointermove', onPointerMove);
	}

	private startRenderingLoop(): void {
		const comp = this;
		(function render() {
			requestAnimationFrame(render);
			comp.controls.render();
			comp.updatePlayerPosition();
			comp.webGLRenderer.render(comp.scene, comp.camera);
			if (comp.labelRenderer) {
				comp.labelRenderer.render(comp.scene, comp.camera);
			}
		})();
	}

	private updatePlayerPosition(): void {
		const cp = this.camera.position;
		this.raycaster.setFromCamera(cp, this.camera);
		//	this.raycaster.ray.origin.y += 400;
		const inters = this.raycaster.intersectObjects(this.floors);

		if (inters.length > 0) {
			// @ts-ignore
			inters[0].object.material.color.setHex(0xFF0000);
			//	cp.y = inters[0].point.y + gc.playerHeight;
			//	console.log('>>>>', JSON.stringify(cp), inters.length)
		} else {
			//	console.log('EMPTY');
		}
	}

	private createWorld(scene: THREE.Scene, map: DoomMap) {
		const startTime = performance.now();

		map.linedefBySector.forEach(renderSector(scene, fl => this.floors.push(fl)));
		console.log('>TIME createWorld>', map.mapDirs[0].name, performance.now() - startTime);
	}
}

const setupCamera = (camera: THREE.PerspectiveCamera, map: DoomMap) => {
	const player = map.things.filter(th => th.thingType == ThingType.PLAYER)[0];
	camera.position.set(1032, 500, 2170);
	//camera.position.set(player.position.x, gc.playerHeight, -player.position.y);
}

const renderSector = (scene: THREE.Scene, florCallback: (floor: THREE.Mesh) => void) => (lbs: LinedefBySector) => {
	renderWalls(lbs).forEach(m => scene.add(m));
	renderFloors(lbs).forEach(m => {
		florCallback(m);
		scene.add(m);
	});
};


const renderFloors = (lbs: LinedefBySector): THREE.Mesh[] => {

	//if (lbs.sector.id !== 49) {
	//	return [];
//	}

	const floor = lbs.floor;
	const wallPoints = mf.pathToPoints(floor.walls).map(p => tm.toVector2(p));
	const wallShape = new THREE.Shape(wallPoints);
	tm.getHoles(floor).exec(holes => holes.forEach(hole => wallShape.holes.push(hole)));
	const geometry = new THREE.ShapeGeometry(wallShape);

	const material = floor.sector.floorTexture.map(tx => tm.createFloorDataTexture(tx)).map(tx => new THREE.MeshPhongMaterial({
		side: THREE.DoubleSide,
		map: tx
	})).orElseGet(() => tm.createFallbackMaterial());

	const mesh = new THREE.Mesh(geometry, material); // TODO tm.fallbackMaterial -> material
	mesh.rotation.set(Math.PI / 2, Math.PI, Math.PI);
	mesh.position.y = lbs.sector.floorHeight;
	return [mesh];
};

const renderWalls = (lbs: LinedefBySector): THREE.Mesh[] => {
	const mesh: THREE.Mesh[] = [];

	const lowerUpperSide = () => THREE.DoubleSide;
	const lowerUpperTexture = (ld) => ld.frontSide.lowerTexture;

	const lowerStartHeight = (ld) => ld.backSide.map(bs => bs.sector.floorHeight);
	const lowerWallHeight = (ld) => ld.backSide.map(bs => ld.sector.floorHeight - bs.sector.floorHeight);

	const upperStartHeight = (ld) => ld.backSide.map(bs => bs.sector.ceilingHeight);
	const upperWallHeight = (ld) => ld.backSide.map(bs => ld.sector.ceilingHeight - bs.sector.ceilingHeight);

	const middleFrontSide = () => THREE.FrontSide;
	const middleFrontTexture = (ld: Linedef) => ld.frontSide.middleTexture;

	const middleBackSide = () => THREE.BackSide;
	const middleBackTexture = (ld: Linedef) => ld.backSide.map(b => b.middleTexture);

	const middleWallHeight = (ld: Linedef) => Either.ofRight(ld.sector.cellingHeight - ld.sector.floorHeight);
	const middleStart = (ld: Linedef) => Either.ofRight(ld.sector.floorHeight);

	lbs.linedefs.forEach(ld => {
		// lower wall
		wall(lowerUpperSide, lowerUpperTexture, lowerStartHeight, lowerWallHeight)(ld).exec(m => mesh.push(m));

		// middle front wall
		wall(middleFrontSide, middleFrontTexture, middleStart, middleWallHeight)(ld,).exec(m => mesh.push(m));

		// middle back wall
		wall(middleBackSide, middleBackTexture, middleStart, middleWallHeight)(ld).exec(m => mesh.push(m));

		// Upper Wall
		wall(lowerUpperSide, lowerUpperTexture, upperStartHeight, upperWallHeight)(ld).exec(m => mesh.push(m));

	});
	return mesh;
};

const wall = (sideFunc: (ld: Linedef) => Side,
							textureFunc: (ld: Linedef) => Either<DoomTexture>,
							startHeightFunc: (ld: Linedef) => Either<number>,
							wallHeightFunc: (ld: Linedef) => Either<number>) => (ld: Linedef, color = null): Either<THREE.Mesh> => {
	const startHeightEi = startHeightFunc(ld);
	const wallHeightEi = wallHeightFunc(ld);
	const textureEi = textureFunc(ld);
	return Either.ofTruth([startHeightEi, wallHeightEi, textureEi], () => {
		const vs = ld.start;
		const ve = ld.end;
		const wallWidth = Math.hypot(ve.x - vs.x, ve.y - vs.y);
		const material = tm.createWallMaterial(textureEi.get(), sideFunc(ld), color);
		const wallHeight = wallHeightEi.get();
		const mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(wallWidth, wallHeight), material);
		mesh.position.set((vs.x + ve.x) / 2, startHeightEi.get() + wallHeight / 2, (vs.y + ve.y) / -2);
		mesh.rotateY(Math.atan2(ve.y - vs.y, ve.x - vs.x));
		return mesh;
	});
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

const createCamera = (canvas: HTMLCanvasElement): THREE.PerspectiveCamera => new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 1, 20000);

const createWebGlRenderer = (canvas: HTMLCanvasElement): THREE.WebGLRenderer => {
	const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
	renderer.physicallyCorrectLights = true;
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	renderer.setPixelRatio(window.devicePixelRatio);
	return renderer;
};
