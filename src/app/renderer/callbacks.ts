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
import * as T from "three";
import {DoomMap, Wad} from "../wad/parser/wad-model";

// ### each service implementing callback has to be registered at: callback-dispatcher.service.ts ###

export interface RenderCallback {
	onRender(deltaMs: number, renderer: T.WebGLRenderer): void
}

export interface InitCallback {
	init(canvas: HTMLCanvasElement, scene: T.Scene, camera: T.PerspectiveCamera): void
}

export interface DisposeCallback {
	dispose(): void
}

export interface BuildMapCallback {
	buildMap(wad: Wad, map: DoomMap, scene: T.Scene): void
}

export interface StartRenderLoopCallback {
	startRenderLoop(): void
}

export interface WindowResizeCallback {
	onResize(width: number, height: number): void
}