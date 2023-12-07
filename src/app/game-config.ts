/*
 * Copyright 2022 Maciej Miklas (MIT License)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import {LinearFilter} from "three/src/constants"
import * as T from "three"

const game = {
	startMap: "E1M1",
}

const player = {
	height: 40,
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
	shadow: {
		receive: true,
		cast: false
	}
}

const wall = {
	shadow: {
		receive: true,
		cast: true
	},
	texture: {
		scroll: {
			speedPerSec: 0.0002,
			resetAt: 1000000
		}
	}
}

enum SkyType {
	BITMAP,
	ORIGINAL
}

const sky = {
	active: 'REDECLIPSE',
	def: [
		{
			name:'SKY1',
			type: SkyType.ORIGINAL,
			color: '#6C6C62',
			position: {
				width: 30000,
				height: 30000,
				depth: 30000,
				y: 12000
			}
		},
		{
			name:'REDECLIPSE',
			type: SkyType.BITMAP,
			color: '#131313',
			position: {
				width: 30000,
				height: 30000,
				depth: 30000,
				y: 0
			},
			bitmap: {
				name: 'redeclipse',
				ext: 'png'
			},
		},
		{
			name:'CORONA',
			type: SkyType.BITMAP,
			color: '#131313',
			position: {
				width: 30000,
				height: 30000,
				depth: 30000,
				y: 0
			},
			bitmap: {
				name: 'corona',
				ext: 'png'
			},
		},
		{
			name:'YELLOW_CLOUD',
			type: SkyType.BITMAP,
			color: '#131313',
			position: {
				width: 30000,
				height: 30000,
				depth: 30000,
				y: 0
			},
			bitmap: {
				name: 'yellowcloud',
				ext: 'jpg'
			},
		},
		{
			name:'GRAY_CLOUD',
			type: SkyType.BITMAP,
			color: '#131313',
			position: {
				width: 30000,
				height: 30000,
				depth: 30000,
				y: 0
			},
			bitmap: {
				name: 'graycloud',
				ext: 'jpg'
			},
		},
		{
			name:'INDIGO',
			type: SkyType.BITMAP,
			color: '#131313',
			position: {
				width: 30000,
				height: 30000,
				depth: 30000,
				y: 0
			},
			bitmap: {
				name: 'indigo',
				ext: 'jpg'
			},
		},
	]
}

const camera = {

	perspective: {
		/** Camera frustum vertical field of view */
		fov: 70,

		/** Camera frustum near plane */
		near: 0.1,

		/** Camera frustum far plane */
		far: 400099
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
export const config = {SkyType, player, move, camera, game, flat, renderer, texture, sky, scene, flashLight, wall}
