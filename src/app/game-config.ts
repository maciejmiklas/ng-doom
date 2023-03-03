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

import {LinearMipMapNearestFilter} from "three/src/constants";

const game = {
	startMap: 0
}

const player = {
	height: 40
}

const move = {
	slow: 3
}

const floor = {
	texture: {
		repeat: {
			x: 0.02,
			y: 0.02
		}
	}
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
		fov: 80,

		/** Camera frustum near plane */
		near: 1,

		/** Camera frustum far plane */
		far: 200000
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
		adjust: {
			y: 400
		}
	}
}

const renderer = {
	physicallyCorrectLights: true,
	antialias: true
}

const texture = {
	anisotropy: 16,
	minFilter: LinearMipMapNearestFilter,
	magFilter: LinearMipMapNearestFilter
}

const debug = {
	axesHelper: {
		visible: false,
		colors: {
			x: 'red',
			y: 'black',
			z: 'green'
		}
	}
}

// ############################ EXPORTS ############################
export const config = {player, move, camera, game, floor, renderer, texture, sky, debug}
