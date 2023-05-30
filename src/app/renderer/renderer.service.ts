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
import {Injectable} from '@angular/core';
import * as T from "three";
import {config as GC} from "../game-config";

@Injectable({
	providedIn: 'root'
})
export class RendererService {

	createRenderer(canvas: HTMLCanvasElement): T.WebGLRenderer {
		const conf = GC.renderer

		const renderer = new T.WebGLRenderer({antialias: conf.antialias, canvas})
		renderer.physicallyCorrectLights = conf.physicallyCorrectLights

		// a beam from the flashlight does not dazzle when getting close to the wall
		//renderer.toneMapping = T.CineonToneMapping
		//renderer.toneMapping = T.ACESFilmicToneMapping;

		renderer.shadowMap.enabled = conf.shadowMap.enabled
		renderer.shadowMap.type = conf.shadowMap.type
		renderer.outputEncoding = conf.outputEncoding
		//renderer.toneMappingExposure = 1;

		if (conf.resolution.width > 0) {
			renderer.setSize(conf.resolution.width, conf.resolution.height)
		} else {
			renderer.setSize(canvas.clientWidth, canvas.clientHeight)
			renderer.setPixelRatio(window.devicePixelRatio)
		}
		return renderer
	}
}
