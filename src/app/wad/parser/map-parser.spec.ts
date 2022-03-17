import {functions as mp, testFunctions as tf} from './map-parser';
import * as R from 'ramda';
import {Directory, Linedef, MapLumpType, Sidedef, Thing, Vertex, WadMap, WadType} from './wad-model';
import {
	E1M1_BLOCKMAP,
	E1M1_LINEDEFS,
	E1M1_THINGS,
	FIRST_MAP_DIR_OFFSET,
	getAllDirs,
	getAllDirsOp,
	getFirstMap,
	getHeader,
	getWadBytes,
	validateDir,
	VERTEX_0,
	VERTEX_1,
	VERTEX_2,
	VERTEX_26,
	VERTEX_27,
	VERTEX_3,
	VERTEX_466
} from './testdata/data';

const getE1M1Dirs = () => tf.parseMapDirs(getAllDirs())(tf.findNextMapStartingDir(getAllDirs())(0).get()).get();

describe('map_parser#parseHeader', () => {
	it('IWAD', () => {
		const header = getHeader().get();
		expect(header.identification).toEqual(WadType.IWAD);
		expect(header.numlumps).toEqual(1264);
		expect(header.infotableofs).toEqual(4175796);
	});
});

const validateMapDirs = (dirs: Directory[]) => {
	expect(dirs[MapLumpType.THINGS].name).toEqual('THINGS');
	expect(dirs[MapLumpType.LINEDEFS].name).toEqual('LINEDEFS');
	expect(dirs[MapLumpType.VERTEXES].name).toEqual('VERTEXES');
	expect(dirs[MapLumpType.SIDEDEFS].name).toEqual('SIDEDEFS');
	expect(dirs[MapLumpType.SEGS].name).toEqual('SEGS');
	expect(dirs[MapLumpType.SSECTORS].name).toEqual('SSECTORS');
	expect(dirs[MapLumpType.NODES].name).toEqual('NODES');
	expect(dirs[MapLumpType.SECTORS].name).toEqual('SECTORS');
	expect(dirs[MapLumpType.REJECT].name).toEqual('REJECT');
	expect(dirs[MapLumpType.BLOCKMAP].name).toEqual('BLOCKMAP');
};

const validateE1M1Dirs = (dirs: Directory[]) => {
	expect(dirs[MapLumpType.MAP_NAME].name).toEqual('E1M1');
	validateMapDirs(dirs);
};

const validateThingsDir = (dir: Directory) => {
	expect(dir.name).toEqual('THINGS');
};

const validateFirstThing = (thing: Thing) => {
	validateThingsDir(thing.dir);
	expect(thing.position.x).toEqual(1056);
	expect(thing.position.y).toEqual(-3616);
	expect(thing.angleFacing).toEqual(90);
	expect(thing.type).toEqual(1);
	expect(thing.flags).toEqual(7);
};

const validateThirdThing = (thing: Thing) => {
	validateThingsDir(thing.dir);
	expect(thing.position.x).toEqual(1104);
	expect(thing.position.y).toEqual(-3600);
	expect(thing.angleFacing).toEqual(90);
	expect(thing.type).toEqual(3);
	expect(thing.flags).toEqual(7);
};

const validateLastThing = (thing: Thing) => {
	validateThingsDir(thing.dir);
	expect(thing.position.x).toEqual(3648);
	expect(thing.position.y).toEqual(-3840);
	expect(thing.angleFacing).toEqual(0);
	expect(thing.type).toEqual(2015);
	expect(thing.flags).toEqual(7);
};

describe('map_parser#parseThing', () => {
	const thingsDir = getAllDirs()[getFirstMap().idx + 1];
	const parser = tf.parseThing(getWadBytes(), thingsDir);

	it('Validate Things Dir', () => {
		validateThingsDir(thingsDir);
	});

	it('First Thing', () => {
		validateFirstThing(parser(0));
	});

	it('Third Thing', () => {
		validateThirdThing(parser(2));
	});

	it('Last Thing', () => {
		validateLastThing(parser(thingsDir.size / 10 - 1));
	});
});

describe('map_parser#parseThings', () => {
	const thingsDir = getAllDirs()[getFirstMap().idx + MapLumpType.THINGS];
	const things: Thing[] = tf.parseThings(getWadBytes())(getE1M1Dirs());

	it('Things dir name', () => {
		expect(thingsDir.name).toEqual('THINGS');
	});

	it('Number of parsed Things', () => {
		expect(things.length).toEqual(thingsDir.size / 10);
	});

	it('First Thing', () => {
		validateFirstThing(things[0]);
	});

	it('Second Thing', () => {
		validateThirdThing(things[2]);
	});

	it('Last Thing', () => {
		validateLastThing(things[things.length - 1]);
	});

	it('Amount', () => {
		expect(things.length).toEqual(138);
	});
});

const validateSidedef0 = (thing: Sidedef) => {
	validateSidedefDir(thing.dir);
	expect(thing.offset.x).toEqual(0);
	expect(thing.offset.y).toEqual(0);
	expect(thing.upperTexture.isLeft()).toBeTruthy();
	expect(thing.lowerTexture.isLeft()).toBeTruthy();
	expect(thing.middleTexture.get()).toEqual('DOOR3');
	expect(thing.sector).toEqual(40);
};

const validateSidedef2 = (thing: Sidedef) => {
	validateSidedefDir(thing.dir);
	expect(thing.offset.x).toEqual(0);
	expect(thing.offset.y).toEqual(0);
	expect(thing.upperTexture.isLeft()).toBeTruthy();
	expect(thing.lowerTexture.isLeft()).toBeTruthy();
	expect(thing.middleTexture.get()).toEqual('LITE3');
	expect(thing.sector).toEqual(40);
};

const validateSidedef26 = (thing: Sidedef) => {
	validateSidedefDir(thing.dir);
	expect(thing.offset.x).toEqual(0);
	expect(thing.offset.y).toEqual(0);
	expect(thing.upperTexture.get()).toEqual('STARTAN3');
	expect(thing.lowerTexture.get()).toEqual('STARTAN3');
	expect(thing.middleTexture.isLeft()).toBeTruthy();
	expect(thing.sector).toEqual(39);
};

const validateSidedef27 = (thing: Sidedef) => {
	validateSidedefDir(thing.dir);
	expect(thing.offset.x).toEqual(0);
	expect(thing.offset.y).toEqual(0);
	expect(thing.upperTexture.isLeft()).toBeTruthy();
	expect(thing.lowerTexture.isLeft()).toBeTruthy();
	expect(thing.middleTexture.isLeft()).toBeTruthy();
	expect(thing.sector).toEqual(14);
};

const validateSidedef189 = (thing: Sidedef) => {
	validateSidedefDir(thing.dir);
	expect(thing.offset.x).toEqual(0);
	expect(thing.offset.y).toEqual(0);
	expect(thing.upperTexture.get()).toEqual('TEKWALL4');
	expect(thing.lowerTexture.get()).toEqual('TEKWALL4');
	expect(thing.middleTexture.isLeft()).toBeTruthy();
	expect(thing.sector).toEqual(24);
};

const validateSidedef211 = (thing: Sidedef) => {
	validateSidedefDir(thing.dir);
	expect(thing.offset.x).toEqual(0);
	expect(thing.offset.y).toEqual(56);
	expect(thing.upperTexture.isLeft()).toBeTruthy();
	expect(thing.lowerTexture.isLeft()).toBeTruthy();
	expect(thing.middleTexture.get()).toEqual('STARTAN3');
	expect(thing.sector).toEqual(3);
};

const validateSidedef442 = (thing: Sidedef) => {
	validateSidedefDir(thing.dir);
	expect(thing.offset.x).toEqual(64);
	expect(thing.offset.y).toEqual(0);
	expect(thing.upperTexture.isLeft()).toBeTruthy();
	expect(thing.lowerTexture.isLeft()).toBeTruthy();
	expect(thing.middleTexture.get()).toEqual('EXITDOOR');
	expect(thing.sector).toEqual(84);
};

const validateSidedefDir = (dir: Directory) => {
	expect(dir.name).toEqual('SIDEDEFS');
};

describe('map_parser#parseSidedef', () => {
	const thingsDir = getAllDirs()[getFirstMap().idx + +MapLumpType.SIDEDEFS];
	const parser = tf.parseSidedef(getWadBytes(), thingsDir);

	it('Sidedef Nr. 0', () => {
		validateSidedef0(parser(0));
	});

	it('Sidedef Nr. 26', () => {
		validateSidedef26(parser(26));
	});

	it('Sidedef Nr. 189', () => {
		validateSidedef189(parser(189));
	});

	it('Sidedef Nr. 211', () => {
		validateSidedef211(parser(211));
	});

	it('Sidedef Nr. 442', () => {
		validateSidedef442(parser(442));
	});
});

describe('map_parser#parseSidedefs', () => {
	const parsed = tf.parseSidedefs(getWadBytes())(getE1M1Dirs());

	it('Sidedef Nr. 0', () => {
		validateSidedef0(parsed[0]);
	});

	it('Sidedef Nr. 26', () => {
		validateSidedef26(parsed[26]);
	});

	it('Sidedef Nr. 189', () => {
		validateSidedef189(parsed[189]);
	});

	it('Sidedef Nr. 211', () => {
		validateSidedef211(parsed[211]);
	});

	it('Sidedef Nr. 442', () => {
		validateSidedef442(parsed[442]);
	});

	it('Amount', () => {
		expect(parsed.length).toEqual(648);
	});
});

const validateVertexesDir = (dir: Directory) => {
	expect(dir.name).toEqual('VERTEXES');
};

const validateVertex = (expected: Vertex, given: Vertex) => {
	expect(expected.x).toEqual(given.x);
	expect(expected.y).toEqual(given.y);
};
const validateFirstVertex = (vertex: Vertex) => {
	validateVertex(vertex, VERTEX_0);
};

const validateThirdVertex = (vertex: Vertex) => {
	validateVertex(vertex, VERTEX_2);
};

const validateLastVertex = (vertex: Vertex) => {
	validateVertex(vertex, VERTEX_466);
};

describe('map_parser#parseVertex', () => {
	const vertexesDir = getAllDirs()[getFirstMap().idx + MapLumpType.VERTEXES];

	const parser = tf.parseVertex(getWadBytes(), vertexesDir);

	it('Validate Vertexes Dir', () => {
		validateVertexesDir(vertexesDir);
	});

	it('First Vertex', () => {
		validateFirstVertex(parser(0));
	});

	it('Third Vertex', () => {
		validateThirdVertex(parser(2));
	});

	it('last Vertex', () => {
		validateLastVertex(parser(466));
	});
});

describe('map_parser#parseVertexes', () => {
	const vertexes = tf.parseVertexes(getWadBytes())(getE1M1Dirs());

	it('First Vertex', () => {
		validateFirstVertex(vertexes[0]);
	});

	it('Third Vertex', () => {
		validateThirdVertex(vertexes[2]);
	});

	it('last Vertex', () => {
		validateLastVertex(vertexes[466]);
	});
});

const validateLindedefsDir = (dir: Directory) => {
	expect(dir.name).toEqual('LINEDEFS');
};

const validateLindedef0 = (lindedef: Linedef) => {
	validateVertex(VERTEX_0, lindedef.start);
	validateVertex(VERTEX_1, lindedef.end);
	expect(lindedef.flags).toEqual(1);
	expect(lindedef.sectorTag).toEqual(0);
	validateSidedef0(lindedef.frontSide);
	expect(lindedef.backSide.isLeft()).toBeTruthy();
};

const validateLindedef2 = (lindedef: Linedef) => {
	validateVertex(VERTEX_3, lindedef.start);
	validateVertex(VERTEX_0, lindedef.end);
	expect(lindedef.flags).toEqual(1);
	expect(lindedef.sectorTag).toEqual(0);
	validateSidedef2(lindedef.frontSide);
	expect(lindedef.backSide.isLeft()).toBeTruthy();
};

const validateLindedef26 = (lindedef: Linedef) => {
	validateVertex(VERTEX_27, lindedef.start);
	validateVertex(VERTEX_26, lindedef.end);
	expect(lindedef.flags).toEqual(29);
	expect(lindedef.sectorTag).toEqual(0);
	validateSidedef26(lindedef.frontSide);
	validateSidedef27(lindedef.backSide.get());
};

describe('map_parser#parseLinedef', () => {
	const linedefDir = getAllDirs()[getFirstMap().idx + MapLumpType.LINEDEFS];
	const vertexes = tf.parseVertexes(getWadBytes())(getE1M1Dirs());
	const sidedefs = tf.parseSidedefs(getWadBytes())(getE1M1Dirs());
	const parser = tf.parseLinedef(getWadBytes(), linedefDir, vertexes, sidedefs);

	it('Validate Lindedefs Dir', () => {
		validateLindedefsDir(linedefDir);
	});

	it('First Linedef', () => {
		const either = parser(0);
		validateLindedef0(either.get());
	});

	it('Third Linedef', () => {
		validateLindedef2(parser(2).get());
	});

	it('27th Linedef', () => {
		validateLindedef26(parser(26).get());
	});
});

describe('map_parser#parseLinedefs', () => {
	const linedefDir = getAllDirs()[getFirstMap().idx + MapLumpType.LINEDEFS];
	const vertexes = tf.parseVertexes(getWadBytes())(getE1M1Dirs());
	const sidedefs = tf.parseSidedefs(getWadBytes())(getE1M1Dirs());
	const linedefs = tf.parseLinedefs(getWadBytes())(getE1M1Dirs(), vertexes, sidedefs);

	it('Validate Lindedefs Dir', () => {
		validateLindedefsDir(linedefDir);
	});

	it('First Linedef', () => {
		validateLindedef0(linedefs[0]);
	});

	it('Third Linedef', () => {
		validateLindedef2(linedefs[2]);
	});

	it('27th Linedef', () => {
		validateLindedef26(linedefs[26]);
	});
});

describe('map_parser -> Parse Map Directory', () => {
	const validate = getHeader().map(v => validateDir(v)).get();

	it('First MAP - THINGS', () => {
		validate(FIRST_MAP_DIR_OFFSET + MapLumpType.THINGS, E1M1_THINGS);
	});

	it('First MAP - LINEDEFS', () => {
		validate(FIRST_MAP_DIR_OFFSET + MapLumpType.LINEDEFS, E1M1_LINEDEFS);
	});

	it('First MAP - BLOCKMAP', () => {
		validate(FIRST_MAP_DIR_OFFSET + MapLumpType.BLOCKMAP, E1M1_BLOCKMAP);
	});
});

describe('map_parser#findNextMapDir', () => {
	const nextDirEi = getAllDirsOp().map(dirs => tf.findNextMapStartingDir(dirs));
	const nextDir = nextDirEi.get();

	it('Validate Next Dir ', () => {
		expect(nextDirEi.isRight).toBeTruthy();
	});

	it('E1M1', () => {
		const mapDir = nextDir(0).get();
		expect(mapDir.name).toEqual('E1M1');
	});

	it('E1M2', () => {
		const mapDir = nextDir(17).get();
		expect(mapDir.name).toEqual('E1M2');
	});

	it('E1M9', () => {
		const mapDir = nextDir(90).get();
		expect(mapDir.name).toEqual('E1M9');
	});

	it('Not found', () => {
		const mapDir = nextDir(9000);
		expect(mapDir.isLeft()).toBeTruthy();
	});

	it('loop', () => {
		let offs = 0;
		for (let i = 0; i < 8; i++) {
			const mapDir = nextDir(offs).get();
			expect(mapDir.name).toEqual('E1M' + (i + 1));
			offs = mapDir.idx + 1;
		}
	});
});

describe('map_parser#isMapName', () => {

	it('MAPxx', () => {
		expect(tf.isMapName('MAP01')).toBe(true);
		expect(tf.isMapName('MAP03')).toBe(true);
		expect(tf.isMapName('MAP23')).toBe(true);
		expect(tf.isMapName('MAP32')).toBe(true);

		expect(tf.isMapName('MA32')).toBe(false);
		expect(tf.isMapName('_MA32')).toBe(false);
		expect(tf.isMapName('32')).toBe(false);
	});

	it('ExMy', () => {
		expect(tf.isMapName('ExMy')).toBe(true);
		expect(tf.isMapName('E1M1')).toBe(true);
		expect(tf.isMapName('E2M3')).toBe(true);

		expect(tf.isMapName('E23')).toBe(false);
		expect(tf.isMapName('E23M1')).toBe(false);
		expect(tf.isMapName('E02M01')).toBe(false);
	});

});

describe('sprite_parser#findNextMapDir', () => {
	const finder = tf.findNextMapStartingDir(getAllDirs());

	it('E1M1', () => {
		expect(finder(0).get().name).toEqual('E1M1');
	});

	it('E1M2', () => {
		expect(finder(15).get().name).toEqual('E1M2');
	});

	it('E1M3', () => {
		expect(finder(25).get().name).toEqual('E1M3');
	});

	it('E1M7', () => {
		expect(finder(70).get().name).toEqual('E1M7');
	});

	it('No More Maps', () => {
		expect(finder(90).isLeft).toBeTruthy();
	});

});

describe('map_parser#parseMapDirs', () => {
	const finder = tf.findNextMapStartingDir(getAllDirs());

	it('E1M1', () => {
		const e1m1 = finder(0).get();
		const dirs = tf.parseMapDirs(getAllDirs())(e1m1).get();
		validateE1M1Dirs(dirs);
	});


	it('E1M7', () => {
		const e1m7 = finder(70).get();
		const dirs = tf.parseMapDirs(getAllDirs())(e1m7).get();
		expect(dirs[MapLumpType.MAP_NAME].name).toEqual('E1M7');
		expect(dirs[MapLumpType.SIDEDEFS].name).toEqual('SIDEDEFS');
		expect(dirs[MapLumpType.BLOCKMAP].name).toEqual('BLOCKMAP');
	});

});

describe('map_parser#findAllMapStartDirs', () => {
	const dirs: Directory[] = tf.findAllMapStartDirs(getAllDirs());
	it('E1M1', () => {
		expect(dirs[0].name).toEqual('E1M1');
	});

	it('E1M2', () => {
		expect(dirs[1].name).toEqual('E1M2');
	});

	it('E1M3', () => {
		expect(dirs[2].name).toEqual('E1M3');
	});

	it('E1M4', () => {
		expect(dirs[3].name).toEqual('E1M4');
	});

	it('E1M5', () => {
		expect(dirs[4].name).toEqual('E1M5');
	});

	it('E1M6', () => {
		expect(dirs[5].name).toEqual('E1M6');
	});

	it('E1M7', () => {
		expect(dirs[6].name).toEqual('E1M7');
	});

	it('E1M8', () => {
		expect(dirs[7].name).toEqual('E1M8');
	});

	it('E1M9', () => {
		expect(dirs[8].name).toEqual('E1M9');
	});

});

describe('map_parser#parseMap', () => {
	const map: WadMap = tf.parseMap(getWadBytes())(getE1M1Dirs());

	it('Map Dirs', () => {
		validateE1M1Dirs(map.mapDirs);
	});

	it('First Linedef', () => {
		validateLindedef0(map.linedefs[0]);
	});

	it('Third Linedef', () => {
		validateLindedef2(map.linedefs[2]);
	});

	it('27th Linedef', () => {
		validateLindedef26(map.linedefs[26]);
	});

	it('First Thing', () => {
		validateFirstThing(map.things[0]);
	});

	it('Second Thing', () => {
		validateThirdThing(map.things[2]);
	});

	it('Last Thing', () => {
		validateLastThing(map.things[map.things.length - 1]);
	});

	it('Things Amount', () => {
		expect(map.things.length).toEqual(138);
	});
});

describe('map_parser#parseMapsDirs', () => {
	const dirs: Directory[] = tf.findAllMapStartDirs(getAllDirs());
	const all: Directory[][] = tf.parseMapsDirs(getAllDirs(), dirs);

	it('Maps Found', () => {
		expect(all.length).toEqual(9);
	});

	it('E1M1', () => {
		validateE1M1Dirs(all[0]);
	});

	it('Validate Each Map Dirs', () => {
		all.forEach(validateMapDirs);
	});

});

describe('map_parser#parseMaps', () => {
	const maps: WadMap[] = mp.parseMaps(getWadBytes(), getAllDirs()).get();

	it('Maps Found', () => {
		expect(maps.length).toEqual(9);
	});

	it('E1M1', () => {
		validateE1M1Dirs(maps[0].mapDirs);
	});

	it('Validate Each Map Dirs', () => {
		maps.map(m => m.mapDirs).forEach(validateMapDirs);
	});
});

describe('map_parser#findMinX', () => {
	const defs: Linedef[] = mp.parseMaps(getWadBytes(), getAllDirs()).get()[0].linedefs;
	it('findMinX', () => {
		expect(tf.findMinX(defs)).toEqual(-768);
	});
});

describe('map_parser#findMinY', () => {
	const defs: Linedef[] = mp.parseMaps(getWadBytes(), getAllDirs()).get()[0].linedefs;

	it('findMinY', () => {
		expect(tf.findMinY(defs)).toEqual(-4864);
	});
});


describe('map_parser#normalizeMap', () => {
	const defs: Linedef[] = mp.parseMaps(getWadBytes(), getAllDirs()).get()[0].linedefs;

	it('findMax', () => {
		expect(tf.findMax(defs)).toEqual(3808);
	});
});

describe('map_parser#scalePos', () => {
	const scale = tf.scalePos(4)(3);

	it('0', () => {
		expect(scale(1)).toEqual(1); // (3 + 1)/4 = 1
	});

	it('2', () => {
		expect(scale(20)).toEqual(6);
	});

	it('8', () => {
		expect(scale(80)).toEqual(21);
	});

});

describe('map_parser#normalizeLinedefs', () => {
	const defs: Linedef[] = mp.parseMaps(getWadBytes(), getAllDirs()).get()[0].linedefs;
	const nt = (scale: number) => (xy: boolean) =>  R.reduce(R.max, Number.MIN_SAFE_INTEGER, mp.normalizeLinedefs(scale)(defs).map(d => xy ? d.start.x : d.start.y));

	it('positive values', () => {
		mp.normalizeLinedefs(3)(defs).forEach(ld => {
			expect(ld.start.x).toBeGreaterThanOrEqual(0);
			expect(ld.start.y).toBeGreaterThanOrEqual(0);
			expect(ld.end.x).toBeGreaterThanOrEqual(0);
			expect(ld.end.y).toBeGreaterThanOrEqual(0);
		});
	});

	it('max values for 2x', () => {
		const nt3 = nt(2);
		expect(nt3(true)).toEqual(2288);
		expect(nt3(false)).toEqual(1408);
	});

	it('max values for 3x', () => {
		const nt3 = nt(3);
		expect(nt3(true)).toEqual(1525);
		expect(nt3(false)).toEqual(939);
	});


	it('max values for 10x', () => {
		const nt3 = nt(10);
		expect(nt3(true)).toEqual(458);
		expect(nt3(false)).toEqual(282);
	});

	it('to json', () => {
		console.log(JSON.stringify(mp.normalizeLinedefs(12)(defs).map(d => ({s: d.start, e: d.end}))));
	});
});
