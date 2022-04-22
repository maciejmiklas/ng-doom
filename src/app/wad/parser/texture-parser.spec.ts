import {functions as tp, testFunctions as tf} from './texture-parser';

import {getAllDirs, getWadBytes} from './testdata/data';
import {MapPatch, Pnames} from './wad-model';

describe('texture-parser#parsePnames', () => {
	const pn: Pnames = tp.parsePnames(getWadBytes(), getAllDirs());

	it('Directory', () => {
		expect(pn.dir.name).toEqual('PNAMES');
	});

	it('Amount', () => {
		expect(pn.nummappatches).toEqual(350);
	});

	it('Max name length', () => {
		pn.names.forEach(n => expect(n.length).toBeLessThanOrEqual(8));
	});

	it('Names', () => {
		expect(pn.names[0]).toEqual('WALL00_3');
		expect(pn.names[2]).toEqual('DOOR2_1');
		expect(pn.names[4]).toEqual('DOOR9_1');
		expect(pn.names[304]).toEqual('WALL51_1');
		expect(pn.names[307]).toEqual('W108_1');
		expect(pn.names[309]).toEqual('WALL49_1');
		expect(pn.names[310]).toEqual('WALL49_2');
	});
});
describe('texture-parser#parseMapPatch', () => {
	const pn: Pnames = tp.parsePnames(getWadBytes(), getAllDirs());
	const patchParser = tf.parseMapPatch(getWadBytes(), pn);

	it('Patch at 0', () => {
		const mp: MapPatch = patchParser(0).get();
		expect(mp.patchIdx).toEqual(2);
	});


});

