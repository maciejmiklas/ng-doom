import {functions as wp, testFunctions as tf} from './wad_parser';
import {ALL_DIRS, validateTitleColumn, validateTitlePatchHeader, WAD_BYTES,} from '../test/data';
import {functions as dp} from './directory_parser';
import {WadType} from './wad_model';

describe('parseTitlePic', () => {
	const tp = tf.parseTitlePic(WAD_BYTES, ALL_DIRS.get());
	it('Found Pictures', () => {
		expect(tp.isRight()).toBeTruthy();
		expect(tp.get().credit).toBeTruthy();
		expect(tp.get().title).toBeTruthy();
		expect(tp.get().help).toBeTruthy();
		expect(tp.get().help.get().length).toEqual(2);
	});

	it('TITLE', () => {
		validateTitlePatchHeader(tp.get().title.header);
		validateTitleColumn(tp.get().title.columns[0]);
		validateTitleColumn(tp.get().title.columns[7]);
	});
});

describe('parseWad', () => {
	const wad = wp.parseWad(WAD_BYTES).get();

	it('wad.header', () => {
		expect(wad.header.identification).toEqual(WadType.IWAD);
	});

	it('wad.dirs', () => {
		expect(wad.dirs.length).toBeGreaterThan(50);
		const df = dp.findDirectoryByName(wad.dirs);
		expect(df('TITLEPIC').isRight()).toBeTruthy();
		expect(df('E1M1').isRight()).toBeTruthy();
		expect(df('VERTEXES').isRight()).toBeTruthy();
	});
});
