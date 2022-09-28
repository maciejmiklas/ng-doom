/*
 * Copyright 2022 Maciej Miklas
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
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
import {functions as tp, testFunctions as tf} from './texture-parser';

import {getAllDirs, getPalette, getPatches, getPnames, getWadBytes} from './testdata/data';
import {Bitmap, BitmapSprite, Directories, Directory, DoomTexture, Pnames, Sprite} from './wad-model';
import {functions as dp} from './directory-parser';
import {functions as sp} from './sprite-parser';
import {functions as bp} from './bitmap-parser';

describe('texture-parser#findPatchDir', () => {
	const pn: Pnames = tp.parsePnames(getWadBytes(), getAllDirs()).get();
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

describe('texture-parser#findFlatDirs', () => {
	const flats = tf.findFlatDirs(getAllDirs());

	it('size', () => {
		expect(flats.get().length).toEqual(54)
	});

	it('No _END', () => {
		expect(flats.get().find(d => d.name === 'F1_END')).toBeUndefined();
	});

	it('No _START', () => {
		expect(flats.get().find(d => d.name === 'F1_START')).toBeUndefined();
	});

	it('Found FLOOR1_7', () => {
		expect(flats.get().find(d => d.name === 'FLOOR1_7').name).toEqual('FLOOR1_7');
	});

	it('Found STEP2', () => {
		expect(flats.get().find(d => d.name === 'STEP2').name).toEqual('STEP2');
	});
});

describe('texture-parser#parsePnames', () => {
	const pn: Pnames = tp.parsePnames(getWadBytes(), getAllDirs()).get();

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

describe('texture-parser#parsePnames', () => {
	const pn: Pnames = tp.parsePnames(getWadBytes(), getAllDirs()).get();

	it('Correct amount', () => {
		expect(pn.nummappatches).toEqual(350);
	});

	it('Amount matches', () => {
		expect(pn.nummappatches).toEqual(pn.names.length);
	});

	it('Pname at 0', () => {
		expect(pn.names[0]).toEqual('WALL00_3');
	});

	it('Pname at 18', () => {
		expect(pn.names[18]).toEqual('WALL02_1');
	});

	it('Pname at 48', () => {
		expect(pn.names[48]).toEqual('COMP03_7');
	});
});

describe('texture-parser#parsePatches', () => {
	const pb: Bitmap[] = tp.parsePatches(getWadBytes(), getAllDirs(), getPalette(), getPnames());

	it('Bitmap size', () => {
		expect(pb.length).toEqual(163);
	});

	it('Bitmap width', () => {
		pb.forEach(b => {
			expect(b.header.width).toBeGreaterThanOrEqual(0);
			expect(b.header.width).toBeLessThanOrEqual(320);
		});
	});

	it('Bitmap height', () => {
		pb.forEach(b => {
			expect(b.header.height).toBeGreaterThanOrEqual(0);
			expect(b.header.height).toBeLessThanOrEqual(200);
		});
	});
});

describe('texture-parser#toImageData', () => {
	const findDir = dp.findDirectoryByName(getAllDirs());
	const titleDir = findDir(Directories.TITLEPIC).get();
	const titleBitmap = bp.parseBitmap(getWadBytes(), getPalette())(titleDir).get();
	const imageData = tf.toImageData(titleBitmap);

	it('TITLEPIC - image data size', () => {
		expect(imageData.data.length).toEqual(320 * 200 * 4);
	});

	it('TITLEPIC - image data - 4th pixel', () => {
		for (let idx = 3; idx < 320 * 200 * 4; idx += 4) {
			const pix = imageData.data[idx];
			expect(pix).toBeDefined();
			if (pix !== 0 && pix !== 255) {
				fail('pix: ' + pix + ' on ' + idx);
				return;
			}
		}
	});

	it('TITLEPIC - random pixels', () => {
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

describe('texture-parser#toBitmapSprite', () => {
	const sprites: Sprite[] = sp.parseSpritesAsArray(getWadBytes(), getAllDirs());

	it('AMMO', () => {
		const bs: BitmapSprite = tf.toBitmapSprite(sprites[0].animations[0]).get();
		expect(bs.name).toEqual('AMMO');
		expect(bs.angle).toEqual('0');
		bs.frames.forEach(f => {
			expect(f.header.dir.name).toContain('AMMO');
		});
	});

	it('BKEY', () => {
		const bs: BitmapSprite = tf.toBitmapSprite(sprites[10].animations[0]).get();
		expect(bs.name).toEqual('BKEY');
		expect(bs.angle).toEqual('0');
		bs.frames.forEach(f => {
			expect(f.header.dir.name).toContain('BKEY');
		});
	});
});

describe('texture-parser#maxSpriteSize', () => {
	const sprites: Sprite[] = sp.parseSpritesAsArray(getWadBytes(), getAllDirs());

	it('AMMO', () => {
		const bs: BitmapSprite = tf.toBitmapSprite(sprites[0].animations[0]).get();
		expect(bs.name).toEqual('AMMO');
		expect(tf.maxSpriteSize(bs)).toEqual(28);

		bs.frames.forEach(f => {
			expect(f.header.width).toBeLessThanOrEqual(28);
			expect(f.header.height).toBeLessThanOrEqual(28);
		});
	});

	it('BKEY', () => {
		const bs: BitmapSprite = tf.toBitmapSprite(sprites[10].animations[0]).get();
		expect(bs.name).toEqual('BKEY');
		expect(tf.maxSpriteSize(bs)).toEqual(16);
		bs.frames.forEach(f => {
			expect(f.header.width).toBeLessThanOrEqual(16);
			expect(f.header.height).toBeLessThanOrEqual(16);
		});
	});
});


describe('texture-parser#parseTextures', () => {
	const pn: Pnames = tp.parsePnames(getWadBytes(), getAllDirs()).get();
	const tx: DoomTexture[] = tp.parseTextures(getWadBytes(), getAllDirs(), getPnames(), getPatches()).get();

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

	it('Texture AASTINKY', () => {
		const txx = tx[0];
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

	it('Texture SW2STON1', () => {
		const txx = tx[116];
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


	it('Texture STARTAN2', () => {
		const txx = tx[69];
		expect(txx.name).toEqual('STARTAN2');
		expect(txx.width).toEqual(128);
		expect(txx.height).toEqual(128);
		expect(txx.patchCount).toEqual(4);
		expect(txx.patches.length).toEqual(4);

		expect(txx.patches[0].patchName).toEqual('SW17_4');
		expect(txx.patches[0].originX).toEqual(0);
		expect(txx.patches[0].originY).toEqual(0);
		expect(txx.patches[0].patchIdx).toEqual(120);

		expect(txx.patches[1].patchName).toEqual('SW17_5');
		expect(txx.patches[1].originX).toEqual(32);
		expect(txx.patches[1].originY).toEqual(0);
		expect(txx.patches[1].patchIdx).toEqual(121);

		expect(txx.patches[2].patchName).toEqual('SW17_6');
		expect(txx.patches[2].originX).toEqual(64);
		expect(txx.patches[2].originY).toEqual(0);
		expect(txx.patches[2].patchIdx).toEqual(122);

		expect(txx.patches[3].patchName).toEqual('SW18_7');
		expect(txx.patches[3].originX).toEqual(96);
		expect(txx.patches[3].originY).toEqual(0);
		expect(txx.patches[3].patchIdx).toEqual(123);
	});
});

describe('texture-parser#parseFlats', () => {
	const flats = tp.parseFlats(getWadBytes(), getAllDirs(), getPalette()).get();
	it('amount', () => {
		expect(flats.length).toEqual(54);
	});

	it('dimensions', () => {
		flats.forEach(fl => {
			expect(fl.width).toEqual(64);
			expect(fl.height).toEqual(64);
		})
	});

	it('bytes', () => {
		flats.forEach(fl => {
			expect(fl.rgba.length).toBeGreaterThanOrEqual(64 * 64 * 4);
		})
	});

	it('FLOOR0_1', () => {
		expect(flats[0].name).toEqual('FLOOR0_1');
	});

	it('FLAT5', () => {
		expect(flats[38].name).toEqual('FLAT5');
	});

});
