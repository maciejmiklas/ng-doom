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
import {functions as SP, testFunctions as TF} from './sprite-parser'

import {getAllDirs, getPalette, getWadBytes} from './testdata/data'
import {BitmapHeader, Directory} from './wad-model'

describe('sprite_parser#findStartDir', () => {
	it('S_START', () => {
		const dir = TF.findStartDir(getAllDirs()).get()
		expect(dir.name).toEqual('S_START')
	})
})

describe('sprite_parser#findEndDir', () => {
	it('S_END', () => {
		const dir = TF.findEndDir(getAllDirs(), TF.findStartDir(getAllDirs()).get().idx).get()
		expect(dir.name).toEqual('S_END')
	})
})

describe('sprite_parser#findSpriteDirs', () => {
	const sprites: Directory[] = TF.findSpriteDirs(getAllDirs())
	it('First Sprite', () => {
		expect(sprites[0].name).toEqual('CHGGA0')
	})

	it('Last Sprite', () => {
		expect(sprites[sprites.length - 1].name).toEqual('TREDD0')
	})

	it('Sprites Size', () => {
		expect(sprites.length).toEqual(483)
	})

	it('Sprite Name Length', () => {
		sprites.forEach(s => {
				expect(s.name.length).toBeGreaterThanOrEqual(6)
				expect(s.name.length).toBeLessThanOrEqual(8)
			}
		)
	})
})

describe('sprite_parser#groupDirsBySpriteName', () => {
	const sd: Directory[] = TF.findSpriteDirs(getAllDirs())
	const sprites: Directory[][] = TF.groupDirsBySpriteName(sd)
	it('Sprites Size', () => {
		expect(Object.entries(sprites).length).toEqual(61)
	})

	it('Names for Each Sprite', () => {
		sprites.forEach(dirs => {
			dirs.forEach(d => expect(d.name.substring(0, 4)).toEqual(dirs[0].name.substring(0, 4)))
		})
	})

	it('Sprite POSS', () => {
		const dirs = sprites.find(d => d[0].name.startsWith('POSS'))
		expect(dirs.length).toEqual(49)
		dirs.forEach(d => expect(d.name.substring(0, 4)).toEqual('POSS'))
	})

	it('Sprite BOSS', () => {
		const dirs = sprites.find(d => d[0].name.startsWith('BOSS'))
		expect(dirs.length).toEqual(59)
		dirs.forEach(d => expect(d.name.substring(0, 4)).toEqual('BOSS'))
	})

	it('Sprite CHGG', () => {
		const dirs = sprites.find(d => d[0].name.startsWith('CHGG'))
		expect(dirs.length).toEqual(2)
		dirs.forEach(d => expect(d.name.substring(0, 4)).toEqual('CHGG'))
	})
})

const DIR_6: Directory = {idx: 0, filepos: 0, size: 0, name: 'SARGG2'}
const DIR_8: Directory = {idx: 0, filepos: 0, size: 0, name: 'PLAYD1E8'}

describe('sprite_parser#parseXyz', () => {

	it('parseSpriteName 6', () => {
		expect(TF.parseSpriteName(DIR_6)).toEqual('SARG')
	})

	it('parseSpriteName 8', () => {
		expect(TF.parseSpriteName(DIR_8)).toEqual('PLAY')
	})

	it('parseFrameName 6', () => {
		expect(TF.parseFrameName(DIR_6)).toEqual('G')
	})

	it('parseFrameName 8', () => {
		expect(TF.parseFrameName(DIR_8)).toEqual('D')
	})

	it('parseRotation 6', () => {
		expect(TF.parseRotation(DIR_6)).toEqual(2)
	})

	it('parseRotation 8', () => {
		expect(TF.parseRotation(DIR_8)).toEqual(1)
	})

	it('parseMirrorFrameName', () => {
		expect(TF.parseMirrorFrameName(DIR_8)).toEqual('E')
	})

	it('parseMirrorRotation', () => {
		expect(TF.parseMirrorRotation(DIR_8)).toEqual(8)
	})

	it('hasMirrorFrame 6', () => {
		expect(TF.hasMirrorFrame(DIR_6)).toBeFalse()
	})

	it('hasMirrorFrame 8', () => {
		expect(TF.hasMirrorFrame(DIR_8)).toBeTrue()
	})
})

describe('sprite_parser#hasMirrorFrame', () => {
	const dir: Directory = {idx: 0, filepos: 0, size: 0, name: 'PLAYD1'}
	const dirM: Directory = {idx: 0, filepos: 0, size: 0, name: 'PLAYD1E8'}

	it('Has', () => {
		expect(TF.hasMirrorFrame(dirM)).toBeTruthy()
	})

	it('Has Not', () => {
		expect(TF.hasMirrorFrame(dir)).toBeFalsy()
	})
})

describe('sprite_parser#toMainFrame', () => {

	it('TROOE2E8', () => {
		const TROOE2E8 = getAllDirs().filter(d => d.name === 'TROOE2E8')[0]
		const frame = TF.toMainFrame(getWadBytes(), getPalette())(TROOE2E8).get()
		expect(frame.frameName).toEqual('E')
		expect(frame.spriteName).toEqual('TROO')
		expect(frame.rotation).toEqual(2)
		expect(frame.bitmap.name).toEqual('TROOE2E8')
	})

	it('TROOC1', () => {
		const TROOE2E8 = getAllDirs().filter(d => d.name === 'TROOC1')[0]
		const frame = TF.toMainFrame(getWadBytes(), getPalette())(TROOE2E8).get()
		expect(frame.frameName).toEqual('C')
		expect(frame.spriteName).toEqual('TROO')
		expect(frame.rotation).toEqual(1)
		expect(frame.bitmap.name).toEqual('TROOC1')
	})
})

describe('sprite_parser#toMirrorFrame', () => {

	it('TROOE2E8', () => {
		const TROOE2E8 = getAllDirs().filter(d => d.name === 'TROOE2E8')[0]
		const frame = TF.toMirrorFrame(getWadBytes(), getPalette())(TROOE2E8).get()
		expect(frame.frameName).toEqual('E')
		expect(frame.spriteName).toEqual('TROO')
		expect(frame.rotation).toEqual(8)
		expect(frame.bitmap.name).toEqual('TROOE2E8')
	})

	it('TROOH4H6', () => {
		const TROOE2E8 = getAllDirs().filter(d => d.name === 'TROOH4H6')[0]
		const frame = TF.toMirrorFrame(getWadBytes(), getPalette())(TROOE2E8).get()
		expect(frame.frameName).toEqual('H')
		expect(frame.spriteName).toEqual('TROO')
		expect(frame.rotation).toEqual(6)
		expect(frame.bitmap.name).toEqual('TROOH4H6')
	})
})

describe('texture-parser#parseSprites', () => {
	const spritesRec = SP.parseSprites(getWadBytes(), getAllDirs())
	const sprites = Object.values(spritesRec)

	it('Max/Min size', () => {
		sprites.forEach(sp => {
			expect(sp.maxHeight).toBeGreaterThanOrEqual(5)
			expect(sp.maxWidth).toBeGreaterThanOrEqual(5)
		})
	})

	it('Record key match sprite name', () => {
		Object.entries(spritesRec).forEach(en => {
			expect(en[0]).toEqual(en[1].name)
		})
	})

	it('Dir macht sprite', () => {
		sprites.forEach(spr => {
			Object.values(spr.frames).forEach(fra => fra.forEach(fr => {
				expect(fr.dir.name.startsWith(fr.spriteName)).toBeTrue()
				expect(fr.dir.name.startsWith(spr.name)).toBeTrue()
			}))
		})
	})

	it('Frames match sprite name', () => {
		sprites.forEach(spr => {
			Object.values(spr.frames).forEach(fra => fra.forEach(fr => {
				expect(spr.name).toEqual(fr.spriteName)
			}))
		})
	})

	it('Frames names are single char', () => {
		sprites.forEach(spr => {
			Object.values(spr.frames).forEach(fra => fra.forEach(fr => {
				expect(fr.frameName.length).toEqual(1)
				expect(fr.frameName).toMatch(/[A-Z]/)
			}))
		})
	})

	it('Rotation is correct', () => {
		sprites.forEach(spr => {
			Object.values(spr.frames).forEach(fra => fra.forEach(fr => {
				expect(fr.rotation).toBeGreaterThanOrEqual(0)
				expect(fr.rotation).toBeLessThanOrEqual(8)
			}))
		})
	})
})

const widthHeaders: BitmapHeader[] = [
	{
		dir: null,
		width: 25,
		height: 75,
		xOffset: 1,
		yOffset: 1,
		columnofs: null
	},
	{
		dir: null,
		width: 10,
		height: 60,
		xOffset: 1,
		yOffset: 1,
		columnofs: null
	},
	{
		dir: null,
		width: 15,
		height: 65,
		xOffset: 1,
		yOffset: 1,
		columnofs: null
	}]

describe('sprite_parser#findMaxWidth/Height', () => {
	it('findMaxWidth', () => {
		expect(TF.findMaxWidth(widthHeaders)).toEqual(25)
	})

	it('findMaxHeight', () => {
		expect(TF.findMaxHeight(widthHeaders)).toEqual(75)
	})
})





