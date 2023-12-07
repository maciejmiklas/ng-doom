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
import {functions as WP, testFunctions as TF} from './wad-parser'
import {getAllDirs, getPalette, getWadBytes, validateTitleColumn, validateTitlePatchHeader} from './testdata/data'
import {functions as DP} from './directory-parser'
import {Directories, TitlePic, WadType} from './wad-model'
import {Either} from '../../common/either'

describe('wad_parser#parseTitlePic', () => {
	const tp: Either<TitlePic> = TF.parseTitlePic(getWadBytes(), getAllDirs(), getPalette())
	it('Found Pictures', () => {
		expect(tp.isRight()).toBeTruthy()
		expect(tp.get().credit).toBeTruthy()
		expect(tp.get().title).toBeTruthy()
		expect(tp.get().help).toBeTruthy()
		expect(tp.get().help.get().length).toEqual(2)
	})

	it('TITLE', () => {
		validateTitlePatchHeader(tp.get().title.header)
		validateTitleColumn(tp.get().title.columns[0].get())
		validateTitleColumn(tp.get().title.columns[7].get())
	})
})

describe('wad_parser#parseWad', () => {
	const wad = WP.parseWad(getWadBytes()).get()

	it('wad.header', () => {
		expect(wad.header.identification).toEqual(WadType.IWAD)
	})

	it('wad.dirs', () => {
		expect(wad.dirs.length).toBeGreaterThan(50)
		const df = DP.findDirectoryByName(wad.dirs)
		expect(df(Directories.TITLEPIC).isRight()).toBeTruthy()
		expect(df('E1M1').isRight()).toBeTruthy()
		expect(df(Directories.VERTEXES).isRight()).toBeTruthy()
	})

	it('wad.title', () => {
		expect(wad.title.title.header.dir.name).toEqual('TITLEPIC')
		expect(wad.title.title.header.width).toEqual(320)
		expect(wad.title.title.header.height).toEqual(200)

		expect(wad.title.help.get().length).toEqual(2)
		expect(wad.title.credit.header.width).toEqual(320)
		expect(wad.title.credit.header.height).toEqual(200)
	})

	it('wad.maps', () => {
		expect(wad.maps.length).toEqual(9)
		expect(wad.maps[0].mapDirs[0].name).toEqual('E1M1')
	})

	it('wad.playpal', () => {
		expect(wad.playpal.palettes.length).toEqual(13)
	})
})
