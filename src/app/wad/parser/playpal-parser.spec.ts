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
import {functions as TP, testFunctions as TF} from './playpal-parser'
import {getAllDirs, getWadBytes} from './testdata/data'

describe('playpal-parser#parseRBG', () => {
	const parse = TF.parseRBG([1, 2, 3, 44, 55, 66])
	it('parse at 0', () => {
		expect(parse(0)).toEqual({r: 1, g: 2, b: 3, a: 255})
	})

	it('parse at 1', () => {
		expect(parse(1)).toEqual({r: 2, g: 3, b: 44, a: 255})
	})

	it('parse at 3', () => {
		expect(parse(3)).toEqual({r: 44, g: 55, b: 66, a: 255})
	})
})

describe('playpal-parser#parsePlaypal', () => {
	const playpal = TP.parsePlaypal(getWadBytes(), getAllDirs()).get()

	it('palettes amount', () => {
		expect(playpal.palettes.length).toEqual(13)
	})

	it('palette colors', () => {
		playpal.palettes.forEach(palette => {
				expect(palette.colors.length).toEqual(256)
			}
		)
	})

	it('palette - color value', () => {
		playpal.palettes.forEach(palette => {
				palette.colors.forEach(col => {
					expect(col.r).toBeLessThanOrEqual(255)
					expect(col.r).toBeGreaterThanOrEqual(0)
				})
			}
		)
	})

	it('palette[0] - few random colors', () => {
		const palette = playpal.palettes[0].colors
		expect(palette[0]).toEqual({r: 0, g: 0, b: 0, a: 255})
		expect(palette[4]).toEqual({r: 255, g: 255, b: 255, a: 255})
		expect(palette[10]).toEqual({r: 35, g: 43, b: 15, a: 255})
		expect(palette[31]).toEqual({r: 163, g: 59, b: 59, a: 255})
	})
})
