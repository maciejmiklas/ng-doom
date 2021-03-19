import {functions as dp} from './directory_parser';
import {functions as bp, testFunctions as tf} from './bitmap_parser';
import {ALL_DIRS, validateTitleColumn, validateTitlePatchHeader, WAD_BYTES} from '../test/data';
import {PatchHeader} from './wad_model';
import * as R from 'ramda';

describe('Unfold Columnofs', () => {
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

describe('Parse PatchHeader', () => {
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

describe('Parse Column', () => {
	const findDir = dp.findDirectoryByName(ALL_DIRS.get());
	const titleDir = findDir('TITLEPIC').get();
	const patchParser = tf.parsePatchHeader(WAD_BYTES);
	const titlePatch = patchParser(titleDir);

	it('TITLEPIC - column 0', () => {
		validateTitleColumn(tf.parseColumn(WAD_BYTES)(titlePatch.columnofs[0]).get());
	});

	it('TITLEPIC - column 1', () => {
		validateTitleColumn(tf.parseColumn(WAD_BYTES)(titlePatch.columnofs[1]).get());
	});

	it('TITLEPIC - column 319', () => {
		validateTitleColumn(tf.parseColumn(WAD_BYTES)(titlePatch.columnofs[319]).get());
	});

});

describe('Pixel To Image', () => {

	it('aa', () => {
		const res = R.reduce(R.subtract, 0, [1, 2, 3, 4]);
		const res1 = R.reduce(R.subtract)(0, [1, 2, 3, 4]);
		// const res2 = R.reduce(R.subtract)(0)([1, 2, 3, 4]);
		console.log('');
	});
});


describe('Parse Bitmap', () => {
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

});

