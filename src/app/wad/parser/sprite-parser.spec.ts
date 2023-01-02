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
import {functions as sp, testFunctions as tf} from './sprite-parser'

import {getAllDirs, getPalette, getWadBytes} from './testdata/data'
import {Directory, FrameDir, Sprite} from './wad-model'

describe('sprite_parser#findStartDir', () => {
	it('S_START', () => {
		const dir = tf.findStartDir(getAllDirs()).get()
		expect(dir.name).toEqual('S_START')
	})
})

describe('sprite_parser#findEndDir', () => {
	it('S_END', () => {
		const dir = tf.findEndDir(getAllDirs(), tf.findStartDir(getAllDirs()).get().idx).get()
		expect(dir.name).toEqual('S_END')
	})
})

describe('sprite_parser#findSpriteDirs', () => {
	const sprites: Directory[] = tf.findSpriteDirs(getAllDirs())
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
	const sd: Directory[] = tf.findSpriteDirs(getAllDirs())
	const sprites: Directory[][] = tf.groupDirsBySpriteName(sd)
	it('Sprites Size', () => {
		expect(Object.entries(sprites).length).toEqual(61)
	})

	it('Names for Each Sprite', () => {
		sprites.forEach(dirs => {
			dirs.forEach(d => expect(d.name.substr(0, 4)).toEqual(dirs[0].name.substr(0, 4)))
		})
	})

	it('Sprite POSS', () => {
		const dirs = sprites.find(d => d[0].name.startsWith('POSS'))
		expect(dirs.length).toEqual(49)
		dirs.forEach(d => expect(d.name.substr(0, 4)).toEqual('POSS'))
	})

	it('Sprite BOSS', () => {
		const dirs = sprites.find(d => d[0].name.startsWith('BOSS'))
		expect(dirs.length).toEqual(59)
		dirs.forEach(d => expect(d.name.substr(0, 4)).toEqual('BOSS'))
	})

	it('Sprite CHGG', () => {
		const dirs = sprites.find(d => d[0].name.startsWith('CHGG'))
		expect(dirs.length).toEqual(2)
		dirs.forEach(d => expect(d.name.substr(0, 4)).toEqual('CHGG'))
	})

})

describe('sprite_parser#parseDirXyz', () => {
	const dir: Directory = {idx: 0, filepos: 0, size: 0, name: 'PLAYD1E8'}

	it('parseDirSpriteName', () => {
		expect(tf.parseDirSpriteName(dir)).toEqual('PLAY')
	})

	it('parseDirFrameName', () => {
		expect(tf.parseDirFrameName(dir)).toEqual('D')
	})

	it('parseDirAngle', () => {
		expect(tf.parseDirAngle(dir)).toEqual(1)
	})

	it('parseDirMirrorFrameName', () => {
		expect(tf.parseDirMirrorFrameName(dir)).toEqual('E')
	})

	it('parseDirMirrorAngle', () => {
		expect(tf.parseDirMirrorAngle(dir)).toEqual(8)
	})
})

describe('sprite_parser#hasMirrorFrame', () => {
	const dir: Directory = {idx: 0, filepos: 0, size: 0, name: 'PLAYD1'}
	const dirM: Directory = {idx: 0, filepos: 0, size: 0, name: 'PLAYD1E8'}

	it('Has', () => {
		expect(tf.hasMirrorFrame(dirM)).toBeTruthy()
	})

	it('Has Not', () => {
		expect(tf.hasMirrorFrame(dir)).toBeFalsy()
	})
})

describe('sprite_parser#toFrameDirs', () => {
	const sd: Directory[] = tf.findSpriteDirs(getAllDirs())
	const sprites = tf.groupDirsBySpriteName(sd)

	it('Sprite POSS - Normal and Mirror', () => {
		const dirs = sprites.find(d => d[0].name.startsWith('POSS'))
		const fd: FrameDir[] = tf.toFrameDirs(getWadBytes(), getPalette())(dirs)
		expect(fd.length).toEqual(70)
		expect(fd.filter(f => !f.mirror).length).toEqual(49)
		expect(fd.filter(f => f.mirror).length).toEqual(21)
	})

	it('Sprite CHGG - Normal without Mirror', () => {
		const dirs = sprites.find(d => d[0].name.startsWith('CHGG'))
		const fd: FrameDir[] = tf.toFrameDirs(getWadBytes(), getPalette())(dirs)
		expect(fd.length).toEqual(2)
		expect(fd.filter(f => !f.mirror).length).toEqual(2)
		expect(fd.filter(f => f.mirror).length).toEqual(0)
	})

	it('Has bitmaps', () => {
		const dirs = sprites.find(d => d[0].name.startsWith('CHGG'))
		const fd: FrameDir[] = tf.toFrameDirs(getWadBytes(), getPalette())(dirs)
		fd.forEach(f => {
			expect(f.bitmap.isRight).toBeTruthy()
		})
	})
})

describe('sprite_parser#toFramesByAngle', () => {
	const sd: Directory[] = tf.findSpriteDirs(getAllDirs())
	const sprites = tf.groupDirsBySpriteName(sd)
	const poss = sprites.find(d => d[0].name.startsWith('POSS'))

	it('Sprite POSS - Angles', () => {
		const fd: FrameDir[] = tf.toFrameDirs(getWadBytes(), getPalette())(poss)
		const de = tf.toFramesByAngle(fd)
		expect(Object.entries(de).length).toEqual(9)
	})

	it('Sprite POSS - Names', () => {
		const fd: FrameDir[] = tf.toFrameDirs(getWadBytes(), getPalette())(poss)
		const byAngle: Record<string, FrameDir[]> = tf.toFramesByAngle(fd)
		for (const angle in byAngle) {
			const frames: FrameDir[] = byAngle[angle]
			frames.forEach(f => expect(f.dir.name.startsWith('POSS')).toBeTruthy())
		}
	})

	it('Sprite POSS - Angles of the Child', () => {
		const fd: FrameDir[] = tf.toFrameDirs(getWadBytes(), getPalette())(poss)
		const byAngle: Record<string, FrameDir[]> = tf.toFramesByAngle(fd)
		for (const angle in byAngle) {
			byAngle[angle].forEach(f => expect(f.angle).toEqual(Number(angle)))
		}
	})

	it('Sprite POSS - Names of the Child Dir', () => {
		const fd: FrameDir[] = tf.toFrameDirs(getWadBytes(), getPalette())(poss)
		const byAngle: Record<string, FrameDir[]> = tf.toFramesByAngle(fd)
		for (const angle in byAngle) {
			byAngle[angle].forEach(f => expect(f.dir.name).toContain('POSS'))
		}
	})

	it('Sprite POSS - Names of the Child', () => {
		const fd: FrameDir[] = tf.toFrameDirs(getWadBytes(), getPalette())(poss)
		const byAngle: Record<string, FrameDir[]> = tf.toFramesByAngle(fd)
		for (const angle in byAngle) {
			byAngle[angle].forEach(f => expect(f.spriteName).toEqual('POSS'))
		}
	})

	it('Sprite POSS - Sort angle 0', () => {
		const fd: FrameDir[] = tf.toFrameDirs(getWadBytes(), getPalette())(poss)
		const frames: FrameDir[] = tf.toFramesByAngle(fd)['0']
		expect(frames[0].frameName).toEqual('H')
		expect(frames[1].frameName).toEqual('I')
		expect(frames[2].frameName).toEqual('J')
		expect(frames[3].frameName).toEqual('K')
		expect(frames[4].frameName).toEqual('L')
		expect(frames[5].frameName).toEqual('M')
	})

	it('Sprite POSS - Sort angle 0', () => {
		const fd: FrameDir[] = tf.toFrameDirs(getWadBytes(), getPalette())(poss)
		const frames: FrameDir[] = tf.toFramesByAngle(fd)['1']
		expect(frames[0].frameName).toEqual('A')
		expect(frames[1].frameName).toEqual('B')
		expect(frames[2].frameName).toEqual('C')
		expect(frames[3].frameName).toEqual('D')
		expect(frames[4].frameName).toEqual('E')
		expect(frames[5].frameName).toEqual('F')
		expect(frames[6].frameName).toEqual('G')
	})

})

describe('sprite_parser#parseSprites', () => {
	it('Keys correspond to names', () => {
		const sprites: Record<string, Sprite> = sp.parseSpritesAsMap(getWadBytes(), getAllDirs())
		for (const spriteName in sprites) {
			const sprite: Sprite = sprites[spriteName]
			for (const angle in sprite.animations) {
				const frame: FrameDir[] = sprite.animations[angle]
				frame.forEach(f => {
					expect(f.spriteName).toEqual(spriteName)
					expect(f.dir.name).toContain(spriteName)
				})
			}
		}
	})
})

describe('sprite_parser#parseSpritesAsArray', () => {
	const sprites: Sprite[] = sp.parseSpritesAsArray(getWadBytes(), getAllDirs())

	it('Sprites Size', () => {
		expect(sprites.length).toEqual(61)
	})

	it('sprites[0]', () => {
		expect(sprites[0].name).toEqual('AMMO')
		expect(sprites[0].animations[0].length).toEqual(1)
	})

	it('sprites[10]', () => {
		expect(sprites[10].name).toEqual('BKEY')
		expect(sprites[10].animations[0].length).toEqual(2)
	})
})



