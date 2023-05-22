/*
 * Copyright 2022 Maciej Miklas
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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

import {LinearFilter} from "three/src/constants";
import * as THREE from "three";

const game = {
	startMap: 0,
}

const player = {
	height: 50
}

const move = {
	distancePerSec: 300
}

const scene = {
	scale: 1,
	ambientLight: {
		color: 0XFFFFCC,
		intensity: 0.8
	},
	debug: {
		axesHelper: {
			visible: false,
			colors: {
				x: 'red',
				y: 'black',
				z: 'green'
			}
		}
	}
}

const flat = {
	texture: {
		repeat: {
			x: 0.02,
			y: 0.02
		}
	},
	receiveShadow: true
}

const wall = {
	receiveShadow: true
}

export enum BoxType {
	BITMAP,
	ORIGINAL
}

const sky = {
	color: '#131313',
	adjust: [{
		type: BoxType.BITMAP,
		width: 30000,
		height: 30000,
		depth: 30000,
		y: 0
	}, {
		type: BoxType.ORIGINAL,
		width: 30000,
		height: 30000,
		depth: 30000,
		y: 12000
	}],
	textureName: 'SKY1',
	box: {
		type: BoxType.BITMAP,
		bitmap: {
			name: 'redeclipse',
			ext: 'png'
		},
		bitmaps: [{
			name: 'corona',
			ext: 'png'
		}, {
			name: 'graycloud',
			ext: 'jpg'
		}, {
			name: 'indigo',
			ext: 'jpg'
		}, {
			name: 'redclipse',
			ext: 'png'
		}, {
			name: 'yellowcloud',
			ext: 'jpg'
		}
		]
	}
}

const camera = {

	perspective: {
		/** Camera frustum vertical field of view */
		fov: 70,

		/** Camera frustum near plane */
		near: 0.1,

		/** Camera frustum far plane */
		far: 20000000
	},

	position: {
		adjust: {
			y: 0
		}
	},

	florRay: {
		direction: {
			x: 0,
			y: -1,
			z: 0
		},
		origin: {
			adjust: {
				y: 500
			}
		}
	},
	debug: {
		crossHelper: false
	}
}

const renderer = {
	physicallyCorrectLights: true,
	antialias: true,
	outputEncoding: THREE.sRGBEncoding,
	resolution: {
		width: -1,
		height: -1
	},
	shadowMap: {
		enabled: true,
		type: THREE.PCFSoftShadowMap
	},
	debug: {
		showFps: true
	}
}

const texture = {
	anisotropy: 16,
	minFilter: LinearFilter,
	magFilter: LinearFilter
}

const flashLight = {
	debug: {
		gui: false
	},
	ambient: {
		penumbra: 0.1,
		castShadow: true,
		decay: 1.4,
		angle: 3.14,
		intensity: 1800,
		color: 0XEBD68F
	},
	img: {
		penumbra: 1,
		castShadow: true,
		decay: 1.5,
		angle: 2,
		intensity: 8000,
		color: 0xFFFFFF,
		img: './assets/img/fissured-glass.png'
	},
	ring1: {
		penumbra: 0.1,
		castShadow: true,
		decay: 1.4,
		angle: 0.39,
		intensity: 1100,
		color: 0xE8B609
	},
	ring2: {
		penumbra: 0.1,
		castShadow: true,
		decay: 1.5,
		angle: 0.16,
		intensity: 1400,
		color: 0xD9C47C
	},
	ring3: {
		penumbra: 0.1,
		castShadow: true,
		decay: 1.5,
		angle: 0.13,
		intensity: 4400,
		color: 0x75652B
	}
}

// ############################ EXPORTS ############################
export const config = {player, move, camera, game, flat, renderer, texture, sky, scene, flashLight, wall}
