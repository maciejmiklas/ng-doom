import {functions as wp, testFunctions as tf} from './wad-parser';
import {getAllDirs, getWadBytes, validateTitleColumn, validateTitlePatchHeader} from './testdata/data';
import {functions as dp} from './directory-parser';
import {Directories, TitlePic, WadType} from './wad-model';
import {Either} from '@maciejmiklas/functional-ts';

describe('wad_parser#parseTitlePic', () => {
	const tp: Either<TitlePic> = tf.parseTitlePic(getWadBytes(), getAllDirs());
	it('Found Pictures', () => {
		expect(tp.isRight()).toBeTruthy();
		expect(tp.get().credit).toBeTruthy();
		expect(tp.get().title).toBeTruthy();
		expect(tp.get().help).toBeTruthy();
		expect(tp.get().help.get().length).toEqual(2);
	});

	it('TITLE', () => {
		validateTitlePatchHeader(tp.get().title.header);
		validateTitleColumn(tp.get().title.columns[0].get());
		validateTitleColumn(tp.get().title.columns[7].get());
	});
});

describe('wad_parser#parseWad', () => {
	const wad = wp.parseWad(getWadBytes()).get();

	it('wad.header', () => {
		expect(wad.header.identification).toEqual(WadType.IWAD);
	});

	it('wad.dirs', () => {
		expect(wad.dirs.length).toBeGreaterThan(50);
		const df = dp.findDirectoryByName(wad.dirs);
		expect(df(Directories.TITLEPIC).isRight()).toBeTruthy();
		expect(df('E1M1').isRight()).toBeTruthy();
		expect(df(Directories.VERTEXES).isRight()).toBeTruthy();
	});

	it('wad.title', () => {
		expect(wad.title.title.header.dir.name).toEqual('TITLEPIC');
		expect(wad.title.title.header.width).toEqual(320);
		expect(wad.title.title.header.height).toEqual(200);

		expect(wad.title.help.get().length).toEqual(2);
		expect(wad.title.credit.header.width).toEqual(320);
		expect(wad.title.credit.header.height).toEqual(200);
	});

	it('wad.maps', () => {
		expect(wad.maps.length).toEqual(9)
		expect(wad.maps[0].mapDirs[0].name).toEqual('E1M1');
	});

	it('wad.playpal', () => {
		expect(wad.playpal.palettes.length).toEqual(13)
	});
});
