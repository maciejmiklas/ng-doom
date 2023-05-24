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
import {functions as BP, testFunctions as TF} from './bitmap-parser'

import {
	getAllDirs,
	getPalette,
	getWadBytes,
	simpleDoomImage,
	validateTitleColumn,
	validateTitlePatchHeader,
	verifySimpleDoomImageAt0x0,
	verifySimpleDoomImageAt0x1,
	verifySimpleDoomImageAt0x2,
	verifySimpleDoomImageAt1x0,
	verifySimpleDoomImageAt1x1,
	verifySimpleDoomImageAt2x0
} from './testdata/data'
import {BitmapHeader, Directories, RgbaBitmap} from './wad-model'
import {functions as DP} from './directory-parser'
import * as R from 'ramda'
import {Either} from '../../common/either'


const validateStbarPatchHeader = (header: BitmapHeader) => {
	expect(header.width).toEqual(320)
	expect(header.height).toEqual(32)
	expect(header.xOffset).toEqual(0)
	expect(header.yOffset).toEqual(0)
}

describe('bitmap-parser#unfoldColumnofs', () => {
	it('Validate size', () => {
		expect(TF.unfoldColumnofs(100, 320).length).toEqual(320)
	})

	it('Validate offsets', () => {
		const unfolded = TF.unfoldColumnofs(1000, 3)
		expect(unfolded[0]).toEqual(1000)
		expect(unfolded[1]).toEqual(1000 + 4)
		expect(unfolded[2]).toEqual(1000 + 8)
	})
})

describe('bitmap-parser#parsePatchHeader', () => {
	const findDir = DP.findDirectoryByName(getAllDirs())
	const patchParser = TF.parsePatchHeader(getWadBytes())
	const titleDir = findDir(Directories.TITLEPIC).get()

	it('TITLEPIC Header', () => {
		validateTitlePatchHeader(patchParser(titleDir))
	})

	it('STBAR Header', () => {
		validateStbarPatchHeader(patchParser(findDir('STBAR').get()))
	})

	it('columnofs file position', () => {
		const columnofs = patchParser(titleDir).columnofs
		let col0 = columnofs[0]

		expect(columnofs.length).toEqual(320)
		let first = true
		for (const col1 of columnofs) {
			if (first) {
				first = false
				continue
			}

			expect(col1).toBeGreaterThan(titleDir.filepos)

			// picture width is 200, plus Post data
			expect(col1 - col0).toEqual(209)
			col0 = col1
		}
	})
})

describe('bitmap-parser#parseColumn', () => {
	const findDir = DP.findDirectoryByName(getAllDirs())
	const titleDir = findDir(Directories.TITLEPIC).get()
	const patchParser = TF.parsePatchHeader(getWadBytes())
	const titlePatch = patchParser(titleDir)
	const parseColumn = TF.parseColumn(getWadBytes(), titleDir)

	it('TITLEPIC - column 0', () => {
		validateTitleColumn(parseColumn(titlePatch.columnofs[0]).get())
	})

	it('TITLEPIC - column 1', () => {
		validateTitleColumn(parseColumn(titlePatch.columnofs[1]).get())
	})

	it('TITLEPIC - column 319', () => {
		validateTitleColumn(parseColumn(titlePatch.columnofs[319]).get())
	})
})

describe('bitmap-parser#parsePost', () => {
	const findDir = DP.findDirectoryByName(getAllDirs())
	const dir = findDir(Directories.TITLEPIC)
	const header = TF.parsePatchHeader(getWadBytes())(dir.get())
	const parsePost = TF.parsePost(getWadBytes())
	// Sizes:
	//  - patch header: 6
	//  - columnofs array: 4 * header.width
	//  - 2 padding bytes after #columnofs
	const postOffsetAt0x0 = header.dir.filepos + 6 + 4 * header.width + 2

	// First Post has 128 bytes + 4 padding
	const postOffsetAt0x1 = postOffsetAt0x0 + 128 + 4

	it('Col 0 - post 0', () => {
		const post = parsePost(postOffsetAt0x0).get()
		expect(post.filepos).toEqual(postOffsetAt0x0)
		expect(post.topdelta).toEqual(0)
		expect(post.data.length).toEqual(128)
	})

	it('Col 0 - post 1', () => {
		const post = parsePost(postOffsetAt0x1).get()
		expect(post.filepos).toEqual(postOffsetAt0x1)
		expect(post.topdelta).toEqual(128)
		expect(post.data.length).toEqual(72)
	})
})

const verifyFlat = (flat:RgbaBitmap) => {
	expect(flat.width).toEqual(64)
	expect(flat.height).toEqual(64)
	expect(flat.rgba.length).toEqual(64 * 64 * 4)
}

describe('bitmap-parser#parseFlat', () => {
	const findDir = DP.findDirectoryByName(getAllDirs())
	const flatParser = BP.parseFlat(getWadBytes(), getPalette())

	it('FLOOR0_1', () => {
		const flat = flatParser(findDir('FLOOR0_1').get()).get()
		verifyFlat(flat)
	})

	it('TLITE6_1', () => {
		const flat = flatParser(findDir('TLITE6_1').get()).get()
		verifyFlat(flat)
	})

	it('FLAT18', () => {
		const flat = flatParser(findDir('FLAT18').get()).get()
		verifyFlat(flat)
	})

})

describe('bitmap-parser#parseBitmap', () => {
	const findDir = DP.findDirectoryByName(getAllDirs())
	const dir = findDir(Directories.TITLEPIC)
	const bitmap = BP.parseBitmap(getWadBytes(), getPalette())(dir.get()).get()

	it('TITLEPIC - header', () => {
		validateTitlePatchHeader(bitmap.header)
	})

	it('TITLEPIC - columns amount', () => {
		expect(bitmap.columns.length).toEqual(320)
	})

	it('TITLEPIC - column height', () => {
		for (const col of bitmap.columns) {
			expect(R.reduce(R.add, 0, col.get().posts.map(p => p.data.length))).toEqual(200)
		}
	})

	it('TITLEPIC - posts top delta', () => {
		bitmap.columns.forEach(c => {
			expect(c.get().posts[0].topdelta).toEqual(0)
			expect(c.get().posts[0].data.length).toEqual(128)

			expect(c.get().posts[1].topdelta).toEqual(128)
			expect(c.get().posts[1].data.length).toEqual(72)
		})
	})

	// FIXME
	// it('TITLEPIC - image data - random pixels', () => {
	// 	 expect(bitmap.imageData[0]).toEqual(128)
	// })
})

describe('bitmap-parser#postAt', () => {
	const pa = TF.postAt(simpleDoomImage().map(Either.ofRight))

	it('column[0] at post[0]', () => {
		verifySimpleDoomImageAt0x0(pa(0, 0).get())
		verifySimpleDoomImageAt0x0(pa(0, 1).get())
		verifySimpleDoomImageAt0x0(pa(0, 2).get())
	})

	it('column[0] between post[0] and post[1]', () => {
		expect(pa(0, 3).isLeft()).toBeTrue()
		expect(pa(0, 10).isLeft()).toBeTrue()
		expect(pa(0, 19).isLeft()).toBeTrue()
	})

	it('column[0] at post[1]', () => {
		verifySimpleDoomImageAt0x1(pa(0, 20).get())
		verifySimpleDoomImageAt0x1(pa(0, 21).get())
	})

	it('column[0] at post[2]', () => {
		verifySimpleDoomImageAt0x2(pa(0, 22).get())
		verifySimpleDoomImageAt0x2(pa(0, 23).get())
		verifySimpleDoomImageAt0x2(pa(0, 24).get())
	})

	it('column[1] at post[0]', () => {
		verifySimpleDoomImageAt1x0(pa(1, 0).get())
		verifySimpleDoomImageAt1x0(pa(1, 1).get())
		verifySimpleDoomImageAt1x0(pa(1, 2).get())
	})

	it('column[1] between post[0] and post[1]', () => {
		for (let y = 4; y < 59; y++) {
			expect(pa(1, y).isLeft()).toBeTrue()
		}
	})

	it('column[1] at post[1]', () => {
		verifySimpleDoomImageAt1x1(pa(1, 60).get())
		verifySimpleDoomImageAt1x1(pa(1, 61).get())
	})

	it('column[2] at post[0]', () => {
		verifySimpleDoomImageAt2x0(pa(2, 0).get())
		verifySimpleDoomImageAt2x0(pa(2, 1).get())
		verifySimpleDoomImageAt2x0(pa(2, 2).get())
		verifySimpleDoomImageAt2x0(pa(2, 3).get())
	})
})

describe('bitmap-parser#postPixelAt', () => {
	const pix = TF.postPixelAt(simpleDoomImage().map(Either.ofRight))
	it('column[0] at post[0]', () => {
		expect(pix(0, 0)).toEqual(11)
		expect(pix(0, 1)).toEqual(12)
		expect(pix(0, 2)).toEqual(13)
	})

	it('column[0] between post[0] and post[1]', () => {
		for (let y = 3; y < 20; y++) {
			expect(pix(0, y)).toEqual(-1)
		}
	})

	it('column[0] at post[1]', () => {
		expect(pix(0, 20)).toEqual(21)
		expect(pix(0, 21)).toEqual(22)
		expect(pix(0, 22)).toEqual(31)
		expect(pix(0, 23)).toEqual(32)
		expect(pix(0, 24)).toEqual(34)
	})

	it('column[1] at post[0]', () => {
		expect(pix(1, 0)).toEqual(101)
		expect(pix(1, 1)).toEqual(102)
		expect(pix(1, 2)).toEqual(103)
	})

	it('column[1] between post[0] and post[1]', () => {
		for (let y = 3; y < 60; y++) {
			expect(pix(1, y)).toEqual(-1)
		}
	})

	it('column[1] at post[1]', () => {
		expect(pix(1, 60)).toEqual(110)
		expect(pix(1, 61)).toEqual(111)
	})

	it('column[2] at post[0]', () => {
		expect(pix(2, 0)).toEqual(201)
		expect(pix(2, 1)).toEqual(202)
		expect(pix(2, 2)).toEqual(203)
		expect(pix(2, 3)).toEqual(204)
	})
})
