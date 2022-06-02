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


import {
	getAllDirs,
	getPalette,
	getPatches,
	getPnames,
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
import {BitmapSprite, Directories, Directory, DoomTexture, Bitmap, BitmapHeader, Pnames, Sprite, TextureDir} from './wad-model';
import {functions as dp} from './directory-parser';
import * as R from 'ramda';
import {Either} from '@maciejmiklas/functional-ts';
import {functions as sp} from './sprite-parser';

describe('texture-parser#unfoldColumnofs', () => {
	it('Validate size', () => {
		expect(tf.unfoldColumnofs(100, 320).length).toEqual(320);
	});

	it('Validate offsets', () => {
		const unfolded = tf.unfoldColumnofs(1000, 3);
		expect(unfolded[0]).toEqual(1000);
		expect(unfolded[1]).toEqual(1000 + 4);
		expect(unfolded[2]).toEqual(1000 + 8);
	});
});

const validateStbarPatchHeader = (header: BitmapHeader) => {
	expect(header.width).toEqual(320);
	expect(header.height).toEqual(32);
	expect(header.xOffset).toEqual(0);
	expect(header.yOffset).toEqual(0);
};

describe('texture-parser#parsePatchHeader', () => {
	const findDir = dp.findDirectoryByName(getAllDirs());
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

describe('texture-parser#parseColumn', () => {
	const findDir = dp.findDirectoryByName(getAllDirs());
	const titleDir = findDir(Directories.TITLEPIC).get();
	const patchParser = tf.parsePatchHeader(getWadBytes());
	const titlePatch = patchParser(titleDir);
	const parseColumn = tf.parseColumn(getWadBytes(), titleDir);

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

describe('texture-parser#parsePost', () => {
	const findDir = dp.findDirectoryByName(getAllDirs());
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

describe('texture-parser#parseBitmap', () => {
	const findDir = dp.findDirectoryByName(getAllDirs());
	const dir = findDir(Directories.TITLEPIC);
	const bitmap = tp.parseBitmap(getWadBytes(), getPalette())(dir.get()).get();

	it('TITLEPIC - header', () => {
		validateTitlePatchHeader(bitmap.header);
	});

	it('TITLEPIC - columns amount', () => {
		expect(bitmap.columns.length).toEqual(320);
	});

	it('TITLEPIC - column height', () => {
		for (const col of bitmap.columns) {
			expect(R.reduce(R.add, 0, col.get().posts.map(p => p.data.length))).toEqual(200);
		}
	});

	it('TITLEPIC - posts top delta', () => {
		bitmap.columns.forEach(c => {
			expect(c.get().posts[0].topdelta).toEqual(0);
			expect(c.get().posts[0].data.length).toEqual(128);

			expect(c.get().posts[1].topdelta).toEqual(128);
			expect(c.get().posts[1].data.length).toEqual(72);
		});
	});

	it('TITLEPIC - image data - random pixels', () => {
		// expect(bitmap.imageData[0]).toEqual(128); TODO
	});
});

describe('texture-parser#postAt', () => {
	const pa = tf.postAt(simpleDoomImage().map(Either.ofRight));

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

describe('texture-parser#parseRBG', () => {
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

describe('texture-parser#parsePlaypal', () => {
	const playpal = tp.parsePlaypal(getWadBytes(), getAllDirs());

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
	const pb: Bitmap[] = tp.parsePatches(getWadBytes(), getAllDirs(), getPalette());

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
	const playpal = tp.parsePlaypal(getWadBytes(), getAllDirs());
	const findDir = dp.findDirectoryByName(getAllDirs());
	const titleDir = findDir(Directories.TITLEPIC).get();
	const titleBitmap = tp.parseBitmap(getWadBytes(), getPalette())(titleDir).get();
	const imageData = tf.toImageData(titleBitmap);

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

describe('texture-parser#postPixelAt', () => {
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

