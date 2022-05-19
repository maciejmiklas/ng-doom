import {functions as tp, testFunctions as tf} from './texture-parser';

import {getAllDirs, getPatches, getPnames, getWadBytes} from './testdata/data';
import {Directory, DoomTexture, PatchBitmap, Pnames, TextureDir} from './wad-model';

describe('texture-parser#findPatchDir', () => {
	const pn: Pnames = tp.parsePnames(getWadBytes(), getAllDirs());
	const finder = tf.findPatchDir(getAllDirs());

	it('Find dirs for pnames', () => {
		pn.names
			.slice(0, 162) // only first 163 patches have corresponding dir
			.forEach((pn, idx) => {
				const found = finder(pn);
				expect(found.isRight()).toBeTrue();
				expect(found.get().name).toEqual(pn);
			});
	});

});

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

describe('texture-parser#parseTextures', () => {
	const pn: Pnames = tp.parsePnames(getWadBytes(), getAllDirs());
	const tx: DoomTexture[] = tp.parseTextures(getWadBytes(), getAllDirs(), getPnames(), getPatches())(TextureDir.TEXTURE1).get();

	it('Textures amount', () => {
		expect(tx.length).toEqual(125);
	});

	it('DoomTexture width', () => {
		tx.forEach(te => {
			expect(te.width).toBeGreaterThanOrEqual(0);
			expect(te.width).toBeLessThanOrEqual(256);
		});
	});

	it('PatchBitmap', () => {
		tx.forEach(te => {
			te.patches.forEach(p => {
				expect(p.bitmap.header.dir.name).toEqual(p.patchName);
			});
			expect(te.width).toBeGreaterThanOrEqual(0);
			expect(te.width).toBeLessThanOrEqual(256);
		});
	});

	it('DoomTexture height', () => {
		tx.forEach(te => {
			expect(te.height).toBeGreaterThanOrEqual(0);
			expect(te.height).toBeLessThanOrEqual(256);
		});
	});

	it('Min patch count', () => {
		tx.forEach(te => {
			expect(te.patchCount).toBeGreaterThan(0);
			expect(te.patchCount).toEqual(te.patches.length);
		});
	});

	it('Patch name', () => {
		tx.forEach(te => {
			te.patches.forEach(p => {
				expect(pn.names.find(name => name === p.patchName)).toEqual(p.patchName);
			});
		});
	});

	it('Patch patchIdx', () => {
		tx.forEach(te => {
			te.patches.forEach(p => {
				expect(pn.names[p.patchIdx]).toEqual(p.patchName);
			});
		});
	});

	it('Patch originX', () => {
		tx.forEach(te => {
			te.patches.forEach(p => {
				expect(p.originX).toBeGreaterThanOrEqual(-256);
				expect(p.originX).toBeLessThanOrEqual(256);
			});
		});
	});

	it('Patch originY', () => {
		tx.forEach(te => {
			te.patches.forEach(p => {
				expect(p.originY).toBeGreaterThanOrEqual(-256);
				expect(p.originY).toBeLessThanOrEqual(256);
			});
		});
	});
	it('DoomTexture at 0', () => {
		let txx = tx[0];
		expect(txx.name).toEqual('AASTINKY');
		expect(txx.width).toEqual(24);
		expect(txx.height).toEqual(72);
		expect(txx.patchCount).toEqual(2);
		expect(txx.patches.length).toEqual(2);

		expect(txx.patches[0].patchName).toEqual('WALL00_3');
		expect(txx.patches[0].originX).toEqual(0);
		expect(txx.patches[0].originY).toEqual(0);

		expect(txx.patches[1].patchName).toEqual('WALL00_3');
		expect(txx.patches[1].originX).toEqual(12);
		expect(txx.patches[1].originY).toEqual(-6);
	});

	it('DoomTexture at 116', () => {
		let txx = tx[116];
		expect(txx.name).toEqual('SW2STON1');
		expect(txx.width).toEqual(64);
		expect(txx.height).toEqual(128);
		expect(txx.patchCount).toEqual(3);
		expect(txx.patches.length).toEqual(3);

		expect(txx.patches[0].patchName).toEqual('W28_8');
		expect(txx.patches[0].originX).toEqual(0);
		expect(txx.patches[0].originY).toEqual(64);
		expect(txx.patches[0].patchIdx).toEqual(144);

		expect(txx.patches[1].patchName).toEqual('W28_8');
		expect(txx.patches[1].originX).toEqual(0);
		expect(txx.patches[1].originY).toEqual(0);
		expect(txx.patches[1].patchIdx).toEqual(144);

		expect(txx.patches[2].patchName).toEqual('SW1S1');
		expect(txx.patches[2].originX).toEqual(16);
		expect(txx.patches[2].originY).toEqual(78);
		expect(txx.patches[2].patchIdx).toEqual(156);
	});
});

describe('texture-parser#parsePatches', () => {
	const pb: PatchBitmap[] = tp.parsePatches(getWadBytes(), getAllDirs());

	it('PatchBitmap size', () => {
		expect(pb.length).toEqual(163);
	});

	it('PatchBitmap width', () => {
		pb.forEach(b => {
			expect(b.header.width).toBeGreaterThanOrEqual(0);
			expect(b.header.width).toBeLessThanOrEqual(320);
		});
	});

	it('PatchBitmap height', () => {
		pb.forEach(b => {
			expect(b.header.height).toBeGreaterThanOrEqual(0);
			expect(b.header.height).toBeLessThanOrEqual(200);
		});
	});

});


