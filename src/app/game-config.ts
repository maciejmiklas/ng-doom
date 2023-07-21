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
import * as T from "three";

const game = {
	startMap: "E1M3",
}

const player = {
	height: 50,
	floorRay: {
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
	damping: {
		fallHeight: 50,
		fallSpeed: 0.50,
		climbSpeed: 0.1
	},
	debug: {
		logSectorName: true
	}
}

const move = {
	distancePerSec: 0.3
}

const scene = {
	scale: 1,
	ambientLight: {
		color: 0XFFFFCC,
		intensity: 0.5
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
	shadow: {
		receive: true,
		cast: false
	}
}

const wall = {
	shadow: {
		receive: true,
		cast: true
	}
}

enum BoxType {
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
	damping: {
		enabled: true,
		factor: 1
	},
	debug: {
		cameraHelper: false
	}
}

const renderer = {
	physicallyCorrectLights: true,
	antialias: true,
	outputEncoding: T.sRGBEncoding,
	resolution: {
		width: -1,
		height: -1
	},
	shadowMap: {
		enabled: true,
		type: T.PCFSoftShadowMap
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
	adjust: {
		position: {x: -20, y: -10, z: 0},
		target: {x: 0, y: -100, z: 0}
	},
	spotLight: {
		shadow: {
			mapSize: 4096,
			bias: -0.00001
		}
	},
	flicker: {
		enabled: true,
		triggerMs: {
			min: 1000,
			max: 30000
		},
		sequence: [
			{
				repeat: {
					min: 0,
					max: 3
				},
				durationMs: {
					min: 100,
					max: 200
				}
			},
			{
				repeat: {
					min: 0,
					max: 10
				},
				durationMs: {
					min: 5,
					max: 10
				}
			},
			{
				repeat: {
					min: 0,
					max: 3
				},
				durationMs: {
					min: 100,
					max: 500
				}
			}
		]
	},
	rings: [
		{
			name: 'ring1',
			penumbra: 0.1,
			castShadow: true,
			decay: 1.4,
			angle: 0.39,
			intensity: 1500,
			color: 0xE8B609,
			distance: 10000
		},
		{
			name: 'ring2',
			penumbra: 0.1,
			castShadow: false,
			decay: 1.5,
			angle: 0.16,
			intensity: 1800,
			color: 0xD9C47C,
			distance: 10000
		},
		{
			name: 'ring3',
			penumbra: 0.5,
			castShadow: true,
			decay: 1.0,
			angle: 0.13,
			intensity: 4800,
			color: 0x75652B,
			distance: 10000,
		}
	],
}

// ############################ EXPORTS ############################
export const config = {BoxType, player, move, camera, game, flat, renderer, texture, sky, scene, flashLight, wall}
