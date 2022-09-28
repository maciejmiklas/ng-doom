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

const game = {
	startLevel: 3
}
const player = {
	height: 50
}

const move = {
	slow: 3
}

const camera = {

	perspective: {
		/** Camera frustum vertical field of view */
		fov: 70,

		/** Camera frustum near plane */
		near: 1,

		/** Camera frustum far plane */
		far: 200000
	},

	florRay: {
		direction: {
			x: 0,
			y: -1,
			z: 0
		}
	}
}


// ############################ EXPORTS ############################
export const config = {player, move, camera, game};
