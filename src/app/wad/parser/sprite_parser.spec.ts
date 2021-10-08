import {testFunctions as tf} from './sprite_parser';
import {getAllDirs} from './testdata/data';
import {Directory} from './wad_model';

describe('sprite_parser#findStartDir', () => {
	it('S_START', () => {
		const dir = tf.findStartDir(getAllDirs().get()).get();
		expect(dir.name).toEqual('S_START');
	});
});

describe('sprite_parser#findEndDir', () => {
	it('S_END', () => {
		const dir = tf.findEndDir(getAllDirs().get(), tf.findStartDir(getAllDirs().get()).get().idx).get();
		expect(dir.name).toEqual('S_END');
	});
});

describe('sprite_parser#findSpriteDirs', () => {
	const sprites: Directory[] = tf.findSpriteDirs(getAllDirs().get());
	it('First Sprite', () => {
		expect(sprites[0].name).toEqual('CHGGA0');
	});

	it('Last Sprite', () => {
		expect(sprites[sprites.length - 1].name).toEqual('TREDD0');
	});

	it('Sprites Size', () => {
		expect(sprites.length).toEqual(483);
	});
});

describe('sprite_parser#groupDirsBySpriteName', () => {
	const sprites = tf.groupDirsBySpriteName(getAllDirs().get());
	it('Sprites Size', () => {
		expect(Object.entries(sprites).length).toEqual(61);
	});

	it('Names for Each Sprite', () => {
		Object.entries(sprites).forEach((record) => {
			const name = record[0];
			record[1].forEach(d => expect(d.name.substr(0, 4)).toEqual(name));
		});
	});

	it('Sprite POSS', () => {
		const dirs = sprites.POSS;
		expect(dirs.length).toEqual(49);
		dirs.forEach(d => expect(d.name.substr(0, 4)).toEqual('POSS'));
	});

	it('Sprite BOSS', () => {
		const dirs = sprites.BOSS;
		expect(dirs.length).toEqual(59);
		dirs.forEach(d => expect(d.name.substr(0, 4)).toEqual('BOSS'));
	});

	it('Sprite CHGG', () => {
		const dirs = sprites.CHGG;
		expect(dirs.length).toEqual(2);
		dirs.forEach(d => expect(d.name.substr(0, 4)).toEqual('CHGG'));
	});

});
