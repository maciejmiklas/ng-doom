import {functions as dp} from './directory_parser';
import {functions as bp, testFunctions as tf} from './bitmap_parser';
import {
	ALL_DIRS,
	simpleDoomImage,
	validateTitleColumn,
	validateTitlePatchHeader,
	verifySimpleDoomImageAt0x0,
	verifySimpleDoomImageAt0x1,
	verifySimpleDoomImageAt0x2,
	verifySimpleDoomImageAt1x0,
	verifySimpleDoomImageAt1x1,
	verifySimpleDoomImageAt2x0,
	WAD_BYTES
} from '../test/data';
import {PatchHeader} from './wad_model';
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
	const findDir = dp.findDirectoryByName(ALL_DIRS.get());
	const patchParser = tf.parsePatchHeader(WAD_BYTES);
	const titleDir = findDir('TITLEPIC').get();

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
	const findDir = dp.findDirectoryByName(ALL_DIRS.get());
	const titleDir = findDir('TITLEPIC').get();
	const patchParser = tf.parsePatchHeader(WAD_BYTES);
	const titlePatch = patchParser(titleDir);
	const parseColumn = tf.parseColumn(WAD_BYTES);

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

describe('bitmap_parser#pixelToImg', () => {

	it('One Pixel', () => {
		const pix = tf.pixelToImg(211);
		expect(pix[0]).toEqual(192);
		expect(pix[1]).toEqual(128);
		expect(pix[2]).toEqual(192);
		expect(pix[3]).toEqual(255);
	});
});

describe('bitmap_parser#parsePost', () => {
	const findDir = dp.findDirectoryByName(ALL_DIRS.get());
	const dir = findDir('TITLEPIC');
	const header = tf.parsePatchHeader(WAD_BYTES)(dir.get());
	const parsePost = tf.parsePost(WAD_BYTES);
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
	const findDir = dp.findDirectoryByName(ALL_DIRS.get());
	const dir = findDir('TITLEPIC');
	const bitmap = bp.parseBitmap(WAD_BYTES)(dir.get()).get();

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

	it('TITLEPIC - image data size', () => {
		expect(bitmap.imageData.length).toEqual(320 * 200 * 4);
	});

	it('TITLEPIC - image data - 4th pixel', () => {
		const length = 320 * 200 * 4;
		for (let idx = 3; idx < length; idx += 4) {
			const pix = bitmap.imageData[idx];
			expect(pix === 0 || pix === 255).toBeTrue();
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

describe('bitmap_parser#postPixelAt', () => {
	const pa = tf.postPixelAt(simpleDoomImage());
	const pix0 = pa(0);
	const pix1 = pa(1);
	const pix2 = pa(2);
	it('column[0] at post[0]', () => {
		expect(pix0(0)).toEqual(11);
		expect(pix0(1)).toEqual(12);
		expect(pix0(2)).toEqual(13);
	});

	it('column[0] between post[0] and post[1]', () => {
		for (let y = 3; y < 20; y++) {
			expect(pix0(y)).toEqual(0);
		}
	});

	it('column[0] at post[1]', () => {
		expect(pix0(20)).toEqual(21);
		expect(pix0(21)).toEqual(22);
		expect(pix0(22)).toEqual(31);
		expect(pix0(23)).toEqual(32);
		expect(pix0(24)).toEqual(34);
	});

	it('column[1] at post[0]', () => {
		expect(pix1(0)).toEqual(101);
		expect(pix1(1)).toEqual(102);
		expect(pix1(2)).toEqual(103);
	});

	it('column[1] between post[0] and post[1]', () => {
		for (let y = 3; y < 60; y++) {
			expect(pix1(y)).toEqual(0);
		}
	});

	it('column[1] at post[1]', () => {
		expect(pix1(60)).toEqual(110);
		expect(pix1(61)).toEqual(111);
	});

	it('column[2] at post[0]', () => {
		expect(pix2(0)).toEqual(201);
		expect(pix2(1)).toEqual(202);
		expect(pix2(2)).toEqual(203);
		expect(pix2(3)).toEqual(204);
	});
});
