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
import * as T from "three"
import {Wad} from "../wad/parser/wad-model"

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
	buildMap(wad: Wad, mapId: number, scene: T.Scene): void
}

export interface StartRenderLoopCallback {
	startRenderLoop(): void
}

export interface WindowResizeCallback {
	onResize(width: number, height: number): void
}
