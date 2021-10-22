import {functions as dp} from './directory_parser';
import {functions as bp, testFunctions as tf} from './bitmap_parser';
import {
	getAllDirs,
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
} from './testdata/data';
import {Directories, PatchHeader} from './wad_model';
import * as R from 'ramda';

describe('bitmap_parser#unfoldColumnofs', () => {
	it('Validate size', () => {
		expect(tf.unfoldColumnofs(100, 320).length).toEqual(320);
	});

	it('Validate 0ffsets', () => {
		const unfolded = tf.unfoldColumnofs(1000, 3);
		expect(unfolded[0]).toEqual(1000);
		expect(unfolded[1]).toEqual(1000 + 4);
		expect(unfolded[2]).toEqual(1000 + 8);
	});
});

const validateStbarPatchHeader = (header: PatchHeader) => {
	expect(header.width).toEqual(320);
	expect(header.height).toEqual(32);
	expect(header.xOffset).toEqual(0);
	expect(header.yOffset).toEqual(0);
};

describe('bitmap_parser#parsePatchHeader', () => {
	const findDir = dp.findDirectoryByName(getAllDirs().get());
	const patchParser = tf.parsePatchHeader(getWadBytes());
	const titleDir = findDir(Directories.TITLEPIC).get();

	it('TITLEPIC Header', () => {
		validateTitlePatchHeader(patchParser(titleDir));
	});

	it('STBAR Header', () => {
		validateStbarPatchHeader(patchParser(findDir('STBAR').get()));
	});

	it('columnofs file position', () => {
		const columnofs = patchParser(titleDir).columnofs;
		let col0 = columnofs[0];

		expect(columnofs.length).toEqual(320);
		let first = true;
		for (const col1 of columnofs) {
			if (first) {
				first = false;
				continue;
			}

			expect(col1).toBeGreaterThan(titleDir.filepos);

			// picture width is 200, plus Post data
			expect(col1 - col0).toEqual(209);
			col0 = col1;
		}
	});
});

describe('bitmap_parser#parseColumn', () => {
	const findDir = dp.findDirectoryByName(getAllDirs().get());
	const titleDir = findDir(Directories.TITLEPIC).get();
	const patchParser = tf.parsePatchHeader(getWadBytes());
	const titlePatch = patchParser(titleDir);
	const parseColumn = tf.parseColumn(getWadBytes());

	it('TITLEPIC - column 0', () => {
		validateTitleColumn(parseColumn(titlePatch.columnofs[0]).get());
	});

	it('TITLEPIC - column 1', () => {
		validateTitleColumn(parseColumn(titlePatch.columnofs[1]).get());
	});

	it('TITLEPIC - column 319', () => {
		validateTitleColumn(parseColumn(titlePatch.columnofs[319]).get());
	});
});

describe('bitmap_parser#parsePost', () => {
	const findDir = dp.findDirectoryByName(getAllDirs().get());
	const dir = findDir(Directories.TITLEPIC);
	const header = tf.parsePatchHeader(getWadBytes())(dir.get());
	const parsePost = tf.parsePost(getWadBytes());
	// Sizes:
	//  - patch header: 6
	//  - columnofs array: 4 * header.width
	//  - 2 padding bytes after #columnofs
	const postOffsetAt0x0 = header.dir.filepos + 6 + 4 * header.width + 2;

	// First Post has 128 bytes + 4 padding
	const postOffsetAt0x1 = postOffsetAt0x0 + 128 + 4;

	it('Col 0 - post 0', () => {
		const post = parsePost(postOffsetAt0x0).get();
		expect(post.filepos).toEqual(postOffsetAt0x0);
		expect(post.topdelta).toEqual(0);
		expect(post.data.length).toEqual(128);
	});

	it('Col 0 - post 1', () => {
		const post = parsePost(postOffsetAt0x1).get();
		expect(post.filepos).toEqual(postOffsetAt0x1);
		expect(post.topdelta).toEqual(128);
		expect(post.data.length).toEqual(72);
	});
});

describe('bitmap_parser#parseBitmap', () => {
	const findDir = dp.findDirectoryByName(getAllDirs().get());
	const dir = findDir(Directories.TITLEPIC);
	const bitmap = bp.parseBitmap(getWadBytes())(dir.get()).get();

	it('TITLEPIC - header', () => {
		validateTitlePatchHeader(bitmap.header);
	});

	it('TITLEPIC - columns amount', () => {
		expect(bitmap.columns.length).toEqual(320);
	});

	it('TITLEPIC - column height', () => {
		for (const col of bitmap.columns) {
			expect(R.reduce(R.add, 0, col.posts.map(p => p.data.length))).toEqual(200);
		}
	});

	it('TITLEPIC - posts top delta', () => {
		bitmap.columns.forEach(c => {
			expect(c.posts[0].topdelta).toEqual(0);
			expect(c.posts[0].data.length).toEqual(128);

			expect(c.posts[1].topdelta).toEqual(128);
			expect(c.posts[1].data.length).toEqual(72);
		});
	});

	it('TITLEPIC - image data - random pixels', () => {
		// expect(bitmap.imageData[0]).toEqual(128); TODO
	});
});

describe('bitmap_parser#postAt', () => {
	const pa = tf.postAt(simpleDoomImage());

	it('column[0] at post[0]', () => {
		verifySimpleDoomImageAt0x0(pa(0, 0).get());
		verifySimpleDoomImageAt0x0(pa(0, 1).get());
		verifySimpleDoomImageAt0x0(pa(0, 2).get());
	});

	it('column[0] between post[0] and post[1]', () => {
		expect(pa(0, 3).isLeft()).toBeTrue();
		expect(pa(0, 10).isLeft()).toBeTrue();
		expect(pa(0, 19).isLeft()).toBeTrue();
	});

	it('column[0] at post[1]', () => {
		verifySimpleDoomImageAt0x1(pa(0, 20).get());
		verifySimpleDoomImageAt0x1(pa(0, 21).get());
	});

	it('column[0] at post[2]', () => {
		verifySimpleDoomImageAt0x2(pa(0, 22).get());
		verifySimpleDoomImageAt0x2(pa(0, 23).get());
		verifySimpleDoomImageAt0x2(pa(0, 24).get());
	});

	it('column[1] at post[0]', () => {
		verifySimpleDoomImageAt1x0(pa(1, 0).get());
		verifySimpleDoomImageAt1x0(pa(1, 1).get());
		verifySimpleDoomImageAt1x0(pa(1, 2).get());
	});

	it('column[1] between post[0] and post[1]', () => {
		for (let y = 4; y < 59; y++) {
			expect(pa(1, y).isLeft()).toBeTrue();
		}
	});

	it('column[1] at post[1]', () => {
		verifySimpleDoomImageAt1x1(pa(1, 60).get());
		verifySimpleDoomImageAt1x1(pa(1, 61).get());
	});

	it('column[2] at post[0]', () => {
		verifySimpleDoomImageAt2x0(pa(2, 0).get());
		verifySimpleDoomImageAt2x0(pa(2, 1).get());
		verifySimpleDoomImageAt2x0(pa(2, 2).get());
		verifySimpleDoomImageAt2x0(pa(2, 3).get());
	});
});

describe('bitmap_parser#parseRBG', () => {
	const parse = tf.parseRBG([1, 2, 3, 44, 55, 66]);
	it('parse at 0', () => {
		expect(parse(0)).toEqual({r: 1, g: 2, b: 3, a: 255});
	});

	it('parse at 1', () => {
		expect(parse(1)).toEqual({r: 2, g: 3, b: 44, a: 255});
	});

	it('parse at 3', () => {
		expect(parse(3)).toEqual({r: 44, g: 55, b: 66, a: 255});
	});
});

describe('bitmap_parser#parsePlaypal', () => {
	const playpal = bp.parsePlaypal(getWadBytes(), getAllDirs().get());

	it('palettes amount', () => {
		expect(playpal.palettes.length).toEqual(13);
	});

	it('palette colors', () => {
		playpal.palettes.forEach(palette => {
				expect(palette.colors.length).toEqual(256);
			}
		);
	});

	it('palette - color value', () => {
		playpal.palettes.forEach(palette => {
				palette.colors.forEach(col => {
					expect(col.r).toBeLessThanOrEqual(255);
					expect(col.r).toBeGreaterThanOrEqual(0);
				});
			}
		);
	});

	it('palette[0] - few random colors', () => {
		const palette = playpal.palettes[0].colors;
		expect(palette[0]).toEqual({r: 0, g: 0, b: 0, a: 255});
		expect(palette[4]).toEqual({r: 255, g: 255, b: 255, a: 255});
		expect(palette[10]).toEqual({r: 35, g: 43, b: 15, a: 255});
		expect(palette[31]).toEqual({r: 163, g: 59, b: 59, a: 255});
	});
});
