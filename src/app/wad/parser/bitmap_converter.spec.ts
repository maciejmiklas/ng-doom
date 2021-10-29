import {functions as bp} from './bitmap_parser';
import {functions as bc, testFunctions as tf} from './bitmap_converter';
import {getAllDirs, getWadBytes, simpleDoomImage} from './testdata/data';
import {functions as dp} from './directory_parser';
import {Directories} from './wad_model';
import {Either} from '@maciejmiklas/functional-ts';


describe('bitmap_converter#toImageData', () => {
	const playpal = bp.parsePlaypal(getWadBytes(), getAllDirs().get());
	const findDir = dp.findDirectoryByName(getAllDirs().get());
	const titleDir = findDir(Directories.TITLEPIC).get();
	const titleBitmap = bp.parseBitmap(getWadBytes())(titleDir).get();
	const imageData = bc.toImageData(titleBitmap)(playpal.palettes[0]);

	it('TITLEPIC - image data size', () => {
		expect(imageData.data.length).toEqual(320 * 200 * 4);
	});

	it('TITLEPIC - image data - 4th pixel', () => {
		for (let idx = 3; idx < 320 * 200 * 4; idx += 4) {
			const pix = imageData.data[idx];
			if (pix !== 0 && pix !== 255) {
				fail('pix: ' + pix + ' on ' + idx);
				return;
			}
		}
	});

	it('TITLEPIC - randoom pixels', () => {
		const data = imageData.data;
		expect(data[0]).toEqual(115);
		expect(data[22]).toEqual(71);
		expect(data[19]).toEqual(255);
		expect(data[37]).toEqual(179);
		expect(data[44]).toEqual(159);
		expect(data[89]).toEqual(0);
		expect(data[112]).toEqual(239);
		expect(data[120]).toEqual(179);
		expect(data[124]).toEqual(159);
		expect(data[396]).toEqual(179);
	});
});

describe('bitmap_parser#postPixelAt', () => {
	const pix = tf.postPixelAt(simpleDoomImage().map(Either.ofRight));
	it('column[0] at post[0]', () => {
		expect(pix(0, 0)).toEqual(11);
		expect(pix(0, 1)).toEqual(12);
		expect(pix(0, 2)).toEqual(13);
	});

	it('column[0] between post[0] and post[1]', () => {
		for (let y = 3; y < 20; y++) {
			expect(pix(0, y)).toEqual(-1);
		}
	});

	it('column[0] at post[1]', () => {
		expect(pix(0, 20)).toEqual(21);
		expect(pix(0, 21)).toEqual(22);
		expect(pix(0, 22)).toEqual(31);
		expect(pix(0, 23)).toEqual(32);
		expect(pix(0, 24)).toEqual(34);
	});

	it('column[1] at post[0]', () => {
		expect(pix(1, 0)).toEqual(101);
		expect(pix(1, 1)).toEqual(102);
		expect(pix(1, 2)).toEqual(103);
	});

	it('column[1] between post[0] and post[1]', () => {
		for (let y = 3; y < 60; y++) {
			expect(pix(1, y)).toEqual(-1);
		}
	});

	it('column[1] at post[1]', () => {
		expect(pix(1, 60)).toEqual(110);
		expect(pix(1, 61)).toEqual(111);
	});

	it('column[2] at post[0]', () => {
		expect(pix(2, 0)).toEqual(201);
		expect(pix(2, 1)).toEqual(202);
		expect(pix(2, 2)).toEqual(203);
		expect(pix(2, 3)).toEqual(204);
	});
});
