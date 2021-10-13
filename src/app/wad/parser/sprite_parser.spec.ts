import {testFunctions as tf} from './sprite_parser';
import {getAllDirs} from './testdata/data';
import {AngleDir, Directory, FrameDir} from './wad_model';

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

	it('Sprite Name Length', () => {
		sprites.forEach(s => {
				expect(s.name.length).toBeGreaterThanOrEqual(6);
				expect(s.name.length).toBeLessThanOrEqual(8);
			}
		);
	});
});

describe('sprite_parser#groupDirsBySpriteName', () => {
	const sd: Directory[] = tf.findSpriteDirs(getAllDirs().get());
	const sprites = tf.groupDirsBySpriteName(sd);
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

describe('sprite_parser#parseDirXyz', () => {
	const dir: Directory = {idx: 0, filepos: 0, size: 0, name: 'PLAYD1E8'};

	it('parseDirSpriteName', () => {
		expect(tf.parseDirSpriteName(dir)).toEqual('PLAY');
	});

	it('parseDirFrameName', () => {
		expect(tf.parseDirFrameName(dir)).toEqual('D');
	});

	it('parseDirAngle', () => {
		expect(tf.parseDirAngle(dir)).toEqual(1);
	});

	it('parseDirMirrorFrameName', () => {
		expect(tf.parseDirMirrorFrameName(dir)).toEqual('E');
	});

	it('parseDirMirrorAngle', () => {
		expect(tf.parseDirMirrorAngle(dir)).toEqual(8);
	});
});

describe('sprite_parser#hasMirrorFrame', () => {
	const dir: Directory = {idx: 0, filepos: 0, size: 0, name: 'PLAYD1'};
	const dirM: Directory = {idx: 0, filepos: 0, size: 0, name: 'PLAYD1E8'};

	it('Has', () => {
		expect(tf.hasMirrorFrame(dirM)).toBeTruthy();
	});

	it('Has Not', () => {
		expect(tf.hasMirrorFrame(dir)).toBeFalsy();
	});
});

describe('sprite_parser#toFrameDirs', () => {
	const sd: Directory[] = tf.findSpriteDirs(getAllDirs().get());
	const sprites: Record<string, Directory[]> = tf.groupDirsBySpriteName(sd);

	it('Sprite POSS - Normal and Mirror', () => {
		const dirs = sprites.POSS;
		const fd: FrameDir[] = tf.toFrameDirs(dirs);
		expect(fd.length).toEqual(70);
		expect(fd.filter(f => !f.mirror).length).toEqual(49);
		expect(fd.filter(f => f.mirror).length).toEqual(21);
	});

	it('Sprite CHGG - Normal without Mirror', () => {
		const dirs = sprites.CHGG;
		const fd: FrameDir[] = tf.toFrameDirs(dirs);
		expect(fd.length).toEqual(2);
		expect(fd.filter(f => !f.mirror).length).toEqual(2);
		expect(fd.filter(f => f.mirror).length).toEqual(0);
	});
});

describe('sprite_parser#toDirsByAngle', () => {
	const sd: Directory[] = tf.findSpriteDirs(getAllDirs().get());
	const sprites: Record<string, Directory[]> = tf.groupDirsBySpriteName(sd);

	it('Sprite POSS - Angles', () => {
		const fd: FrameDir[] = tf.toFrameDirs(sprites.POSS);
		const de: AngleDir[] = tf.toDirsByAngle(fd);
		expect(de.length).toEqual(9);
	});

	it('Sprite POSS - Names', () => {
		const fd: FrameDir[] = tf.toFrameDirs(sprites.POSS);
		const de: AngleDir[] = tf.toDirsByAngle(fd);
		de.forEach(ad => {
			ad.frames.forEach(f => f.dir.name.startsWith('POSS'));
		});
	});

	it('Sprite POSS - Angles', () => {
		const fd: FrameDir[] = tf.toFrameDirs(sprites.POSS);
		const de: AngleDir[] = tf.toDirsByAngle(fd);
		de.forEach(ad => {
			ad.frames.forEach(f => f.angle === ad.angle);
		});
	});

	it('Sprite POSS - Sort angle 0', () => {
		const fd: FrameDir[] = tf.toFrameDirs(sprites.POSS);
		const an: AngleDir = tf.toDirsByAngle(fd)[0];
		expect(an.frames[0].frame).toEqual('H');
		expect(an.frames[1].frame).toEqual('I');
		expect(an.frames[2].frame).toEqual('J');
		expect(an.frames[3].frame).toEqual('K');
		expect(an.frames[4].frame).toEqual('L');
		expect(an.frames[5].frame).toEqual('M');
	});

	it('Sprite POSS - Sort angle 0', () => {
		const fd: FrameDir[] = tf.toFrameDirs(sprites.POSS);
		const an: AngleDir = tf.toDirsByAngle(fd)[1];
		expect(an.frames[0].frame).toEqual('A');
		expect(an.frames[1].frame).toEqual('B');
		expect(an.frames[2].frame).toEqual('C');
		expect(an.frames[3].frame).toEqual('D');
		expect(an.frames[4].frame).toEqual('E');
		expect(an.frames[5].frame).toEqual('F');
		expect(an.frames[6].frame).toEqual('G');
	});
});
