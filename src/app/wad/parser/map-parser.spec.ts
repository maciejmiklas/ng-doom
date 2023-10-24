/*
 * Copyright 2022 Maciej Miklas
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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
import {functions as MP, testFunctions as TF} from './map-parser'
import {
	Directory,
	DoomMap,
	Linedef,
	LinedefBySector,
	LinedefFlag,
	MapLumpType,
	Sector,
	Sidedef,
	Thing,
	Vertex,
	WadType
} from './wad-model'
import {
	E1M1_BLOCKMAP,
	E1M1_LINEDEFS,
	E1M1_THINGS,
	FIRST_MAP_DIR_OFFSET,
	getAllDirs,
	getAllDirsOp,
	getE1M1Dirs,
	getE1M1FlatBySector,
	getE1M1Linedefs,
	getE1M1Sectors,
	getFirstMap,
	getFlats,
	getHeader,
	getMaps,
	getTextures,
	getWadBytes,
	PATH_CLOSED_MIXED,
	PATH_CLOSED_SORTED,
	validateDir,
	VERTEX_0,
	VERTEX_1,
	VERTEX_2,
	VERTEX_26,
	VERTEX_27,
	VERTEX_3,
	VERTEX_466
} from "./testdata/data"
import * as R from 'ramda'

describe('map-parser#parseHeader', () => {
	it('IWAD', () => {
		const header = getHeader().get()
		expect(header.identification).toEqual(WadType.IWAD)
		expect(header.numlumps).toEqual(1264)
		expect(header.infotableofs).toEqual(4175796)
	})
})

const validateMapDirs = (dirs: Directory[]) => {
	expect(dirs[MapLumpType.THINGS].name).toEqual('THINGS')
	expect(dirs[MapLumpType.LINEDEFS].name).toEqual('LINEDEFS')
	expect(dirs[MapLumpType.VERTEXES].name).toEqual('VERTEXES')
	expect(dirs[MapLumpType.SIDEDEFS].name).toEqual('SIDEDEFS')
	expect(dirs[MapLumpType.SEGS].name).toEqual('SEGS')
	expect(dirs[MapLumpType.SSECTORS].name).toEqual('SSECTORS')
	expect(dirs[MapLumpType.NODES].name).toEqual('NODES')
	expect(dirs[MapLumpType.SECTORS].name).toEqual('SECTORS')
	expect(dirs[MapLumpType.REJECT].name).toEqual('REJECT')
	expect(dirs[MapLumpType.BLOCKMAP].name).toEqual('BLOCKMAP')
}

const validateSectorE1M1_0 = (se: Sector): void => {
	expect(se.floorTexture.get().name).toEqual('FLOOR4_8')
	expect(se.cellingTexture.get().name).toEqual('CEIL3_5')
	expect(se.floorHeight).toEqual(0)
	expect(se.cellingHeight).toEqual(72)
	expect(se.lightLevel).toEqual(160)
	expect(se.tagNumber).toEqual(0)
	expect(se.id).toEqual(0)
}

const validateSectorE1M1_1 = (se: Sector): void => {
	expect(se.floorTexture.get().name).toEqual('FLAT18')
	expect(se.cellingTexture.get().name).toEqual('CEIL5_1')
	expect(se.floorHeight).toEqual(32)
	expect(se.cellingHeight).toEqual(88)
	expect(se.lightLevel).toEqual(255)
	expect(se.tagNumber).toEqual(0)
	expect(se.id).toEqual(1)
}

const validateSectorE1M1_4 = (se: Sector): void => {
	expect(se.floorTexture.get().name).toEqual('FLOOR4_8')
	expect(se.cellingTexture.get().name).toEqual('FLAT20')
	expect(se.floorHeight).toEqual(0)
	expect(se.cellingHeight).toEqual(0)
	expect(se.lightLevel).toEqual(208)
	expect(se.tagNumber).toEqual(0)
	expect(se.id).toEqual(4)
}

const validateE1M1Dirs = (dirs: Directory[]) => {
	expect(dirs[MapLumpType.MAP_NAME].name).toEqual('E1M1')
	validateMapDirs(dirs)
}

const validateThingsDir = (dir: Directory) => {
	expect(dir.name).toEqual('THINGS')
}

const validateFirstThing = (thing: Thing) => {
	validateThingsDir(thing.dir)
	expect(thing.position.x).toEqual(1056)
	expect(thing.position.y).toEqual(-3616)
	expect(thing.angleFacing).toEqual(90)
	expect(thing.thingType).toEqual(1)
	expect(thing.flags).toEqual(7)
	expect(thing.sector.id).toEqual(38)
}

const validateThirdThing = (thing: Thing) => {
	validateThingsDir(thing.dir)
	expect(thing.position.x).toEqual(1104)
	expect(thing.position.y).toEqual(-3600)
	expect(thing.angleFacing).toEqual(90)
	expect(thing.thingType).toEqual(3)
	expect(thing.flags).toEqual(7)
	expect(thing.sector.id).toEqual(38)
}

const validateLastThing = (thing: Thing) => {
	validateThingsDir(thing.dir)
	expect(thing.position.x).toEqual(3648)
	expect(thing.position.y).toEqual(-3840)
	expect(thing.angleFacing).toEqual(0)
	expect(thing.thingType).toEqual(2015)
	expect(thing.flags).toEqual(7)
	expect(thing.sector.id).toEqual(62)
}

describe('map-parser#parseThing', () => {
	const thingsDir = getAllDirs()[getFirstMap().idx + 1]
	const parser = TF.parseThing(getWadBytes(), thingsDir, getE1M1FlatBySector())

	it('Validate Things dir', () => {
		validateThingsDir(thingsDir)
	})

	it('First Thing', () => {
		validateFirstThing(parser(0).get())
	})

	it('Third Thing', () => {
		validateThirdThing(parser(2).get())
	})

	it('Last Thing', () => {
		validateLastThing(parser(thingsDir.size / 10 - 1).get())
	})
})

describe('map-parser#parseThings', () => {
	const thingsDir = getAllDirs()[getFirstMap().idx + MapLumpType.THINGS]
	const things: Thing[] = TF.parseThings(getWadBytes(), getE1M1Dirs(), getE1M1FlatBySector())

	it('Things dir name', () => {
		expect(thingsDir.name).toEqual('THINGS')
	})

	it('Number of parsed Things', () => {
		expect(things.length).toEqual(thingsDir.size / 10)
	})

	it('First Thing', () => {
		validateFirstThing(things[0])
	})

	it('Second Thing', () => {
		validateThirdThing(things[2])
	})

	it('Last Thing', () => {
		validateLastThing(things[things.length - 1])
	})

	it('Amount', () => {
		expect(things.length).toEqual(138)
	})
})

const validateSidedef0 = (thing: Sidedef) => {
	validateSidedefDir(thing.dir)
	expect(thing.offset.x).toEqual(0)
	expect(thing.offset.y).toEqual(0)
	expect(thing.upperTexture.isLeft()).toBeTruthy()
	expect(thing.lowerTexture.isLeft()).toBeTruthy()
	expect(thing.middleTexture.get().name).toEqual('DOOR3')
	expect(thing.sector.id).toEqual(40)
}

const validateSidedef2 = (thing: Sidedef) => {
	validateSidedefDir(thing.dir)
	expect(thing.offset.x).toEqual(0)
	expect(thing.offset.y).toEqual(0)
	expect(thing.upperTexture.isLeft()).toBeTruthy()
	expect(thing.lowerTexture.isLeft()).toBeTruthy()
	expect(thing.middleTexture.get().name).toEqual('LITE3')
	expect(thing.sector.id).toEqual(40)
}

const validateSidedef26 = (thing: Sidedef) => {
	validateSidedefDir(thing.dir)
	expect(thing.offset.x).toEqual(0)
	expect(thing.offset.y).toEqual(0)
	expect(thing.upperTexture.get().name).toEqual('STARTAN3')
	expect(thing.lowerTexture.get().name).toEqual('STARTAN3')
	expect(thing.middleTexture.isLeft()).toBeTruthy()
	expect(thing.sector.id).toEqual(39)
}

const validateSidedef27 = (thing: Sidedef) => {
	validateSidedefDir(thing.dir)
	expect(thing.offset.x).toEqual(0)
	expect(thing.offset.y).toEqual(0)
	expect(thing.upperTexture.isLeft()).toBeTruthy()
	expect(thing.lowerTexture.isLeft()).toBeTruthy()
	expect(thing.middleTexture.isLeft()).toBeTruthy()
	expect(thing.sector.id).toEqual(14)
}

const validateSidedef189 = (thing: Sidedef) => {
	validateSidedefDir(thing.dir)
	expect(thing.offset.x).toEqual(0)
	expect(thing.offset.y).toEqual(0)
	expect(thing.upperTexture.get().name).toEqual('TEKWALL4')
	expect(thing.lowerTexture.get().name).toEqual('TEKWALL4')
	expect(thing.middleTexture.isLeft()).toBeTruthy()
	expect(thing.sector.id).toEqual(24)
}

const validateSidedef211 = (thing: Sidedef) => {
	validateSidedefDir(thing.dir)
	expect(thing.offset.x).toEqual(0)
	expect(thing.offset.y).toEqual(56)
	expect(thing.upperTexture.isLeft()).toBeTruthy()
	expect(thing.lowerTexture.isLeft()).toBeTruthy()
	expect(thing.middleTexture.get().name).toEqual('STARTAN3')
	expect(thing.sector.id).toEqual(3)
}

const validateSidedef442 = (thing: Sidedef) => {
	validateSidedefDir(thing.dir)
	expect(thing.offset.x).toEqual(64)
	expect(thing.offset.y).toEqual(0)
	expect(thing.upperTexture.isLeft()).toBeTruthy()
	expect(thing.lowerTexture.isLeft()).toBeTruthy()
	expect(thing.middleTexture.get().name).toEqual('EXITDOOR')
	expect(thing.sector.id).toEqual(84)
}

const validateSidedefDir = (dir: Directory) => {
	expect(dir.name).toEqual('SIDEDEFS')
}

describe('map-parser#parseSidedef', () => {
	const thingsDir = getAllDirs()[getFirstMap().idx + +MapLumpType.SIDEDEFS]
	const parser = TF.parseSidedef(getWadBytes(), thingsDir, TF.createTextureLoader(getTextures()), getE1M1Sectors())

	it('Sidedef Nr. 0', () => {
		validateSidedef0(parser(0).get())
	})

	it('Sidedef Nr. 26', () => {
		validateSidedef26(parser(26).get())
	})

	it('Sidedef Nr. 189', () => {
		validateSidedef189(parser(189).get())
	})

	it('Sidedef Nr. 211', () => {
		validateSidedef211(parser(211).get())
	})

	it('Sidedef Nr. 442', () => {
		validateSidedef442(parser(442).get())
	})
})

describe('map-parser#parseSidedefs', () => {
	const parsed = TF.parseSidedefs(getWadBytes(), TF.createTextureLoader(getTextures()))(getE1M1Dirs(), getE1M1Sectors())

	it('Sidedef Nr. 0', () => {
		validateSidedef0(parsed[0].get())
	})

	it('Sidedef Nr. 26', () => {
		validateSidedef26(parsed[26].get())
	})

	it('Sidedef Nr. 189', () => {
		validateSidedef189(parsed[189].get())
	})

	it('Sidedef Nr. 211', () => {
		validateSidedef211(parsed[211].get())
	})

	it('Sidedef Nr. 442', () => {
		validateSidedef442(parsed[442].get())
	})

	it('Amount', () => {
		expect(parsed.length).toEqual(648)
	})

//		it('Sidedef Index', () => {
//			parsed.forEach(sd => {
//				expect(sd.get().sector.id).toBeGreaterThanOrEqual(0)
//				expect(sd.get().sector.id).toBeLessThanOrEqual(E1M1_SECTORS)
//			})
//		})
})

const validateVertexesDir = (dir: Directory) => {
	expect(dir.name).toEqual('VERTEXES')
}

const validateVertex = (expected: Vertex, given: Vertex) => {
	expect(expected.x).toEqual(given.x)
	expect(expected.y).toEqual(given.y)
}
const validateFirstVertex = (vertex: Vertex) => {
	validateVertex(vertex, VERTEX_0)
}

const validateThirdVertex = (vertex: Vertex) => {
	validateVertex(vertex, VERTEX_2)
}

const validateLastVertex = (vertex: Vertex) => {
	validateVertex(vertex, VERTEX_466)
}

describe('map-parser#parseVertex', () => {
	const vertexesDir = getAllDirs()[getFirstMap().idx + MapLumpType.VERTEXES]

	const parser = TF.parseVertex(getWadBytes(), vertexesDir)

	it('Validate Vertexes Dir', () => {
		validateVertexesDir(vertexesDir)
	})

	it('First Vertex', () => {
		validateFirstVertex(parser(0))
	})

	it('Third Vertex', () => {
		validateThirdVertex(parser(2))
	})

	it('Last Vertex', () => {
		validateLastVertex(parser(466))
	})
})

describe('map-parser#parseVertexes', () => {
	const vertexes = TF.parseVertexes(getWadBytes())(getE1M1Dirs())

	it('First Vertex', () => {
		validateFirstVertex(vertexes[0])
	})

	it('Third Vertex', () => {
		validateThirdVertex(vertexes[2])
	})

	it('Last Vertex', () => {
		validateLastVertex(vertexes[466])
	})
})

const validateLindedefsDir = (dir: Directory) => {
	expect(dir.name).toEqual('LINEDEFS')
}

const validateLindedef0 = (lindedef: Linedef) => {
	validateVertex(VERTEX_0, lindedef.start)
	validateVertex(VERTEX_1, lindedef.end)
	expect(lindedef.flags.size).toEqual(1)
	expect(lindedef.flags.has(LinedefFlag.BLOCKS_PLAYERS_MONSTERS)).toBeTrue()
	expect(lindedef.sectorTag).toEqual(0)
	validateSidedef0(lindedef.frontSide)
	expect(lindedef.backSide.isLeft()).toBeTruthy()
}

const validateLindedef2 = (lindedef: Linedef) => {
	validateVertex(VERTEX_3, lindedef.start)
	validateVertex(VERTEX_0, lindedef.end)
	expect(lindedef.flags.size).toEqual(1)
	expect(lindedef.flags.has(LinedefFlag.BLOCKS_PLAYERS_MONSTERS)).toBeTrue()
	expect(lindedef.sectorTag).toEqual(0)
	validateSidedef2(lindedef.frontSide)
	expect(lindedef.backSide.isLeft()).toBeTruthy()
}

const validateLindedef26 = (lindedef: Linedef) => {
	validateVertex(VERTEX_27, lindedef.start)
	validateVertex(VERTEX_26, lindedef.end)
	expect(lindedef.flags.size).toEqual(4)
	expect(lindedef.flags.has(LinedefFlag.BLOCKS_PLAYERS_MONSTERS)).toBeTrue()
	expect(lindedef.flags.has(LinedefFlag.TWO_SIDED)).toBeTrue()
	expect(lindedef.flags.has(LinedefFlag.UPPER_TEXTURE_UNPEGGED)).toBeTrue()
	expect(lindedef.flags.has(LinedefFlag.LOWER_TEXTURE_UNPEGGED)).toBeTrue()
	expect(lindedef.sectorTag).toEqual(0)
	validateSidedef26(lindedef.frontSide)
	validateSidedef27(lindedef.backSide.get())
}

describe('map-parser#parseLinedef', () => {
	const linedefDir = getAllDirs()[getFirstMap().idx + MapLumpType.LINEDEFS]
	const vertexes = TF.parseVertexes(getWadBytes())(getE1M1Dirs())
	const sidedefs = TF.parseSidedefs(getWadBytes(), TF.createTextureLoader(getTextures()))(getE1M1Dirs(), getE1M1Sectors())
	const parser = TF.parseLinedef(getWadBytes(), linedefDir, vertexes, sidedefs, getE1M1Sectors())

	it('Validate Lindedefs Dir', () => {
		validateLindedefsDir(linedefDir)
	})

	it('First Linedef', () => {
		const either = parser(0)
		validateLindedef0(either.get())
	})

	it('Third Linedef', () => {
		validateLindedef2(parser(2).get())
	})

	it('27th Linedef', () => {
		validateLindedef26(parser(26).get())
	})
})

describe('map-parser#parseLinedefs', () => {
	it('Validate Lindedefs dir', () => {
		validateLindedefsDir(getAllDirs()[getFirstMap().idx + MapLumpType.LINEDEFS])
	})

	it('First Linedef', () => {
		validateLindedef0(getE1M1Linedefs()[0])
	})

	it('Third Linedef', () => {
		validateLindedef2(getE1M1Linedefs()[2])
	})

	it('27th Linedef', () => {
		validateLindedef26(getE1M1Linedefs()[26])
	})

	it('TWO_SIDED set on each two sided Linedef', () => {
		getE1M1Linedefs().filter(ld => ld.backSide.isRight()).forEach(ld => {
			expect(ld.flags.has(LinedefFlag.TWO_SIDED)).toBeTrue()
		})
	})

	it('E1M1 has:152,158,157', () => {
		const ld = getE1M1Linedefs()
		expect(ld.findIndex(ld => ld.id === 152) >= 0).toBeTrue()
		expect(ld.findIndex(ld => ld.id === 158) >= 0).toBeTrue()
		expect(ld.findIndex(ld => ld.id === 157) >= 0).toBeTrue()
	})

})

describe('map-parser -> Parse Map Directory', () => {
	const validate = getHeader().map(v => validateDir(v)).get()

	it('First MAP - THINGS', () => {
		validate(FIRST_MAP_DIR_OFFSET + MapLumpType.THINGS, E1M1_THINGS)
	})

	it('First MAP - LINEDEFS', () => {
		validate(FIRST_MAP_DIR_OFFSET + MapLumpType.LINEDEFS, E1M1_LINEDEFS)
	})

	it('First MAP - BLOCKMAP', () => {
		validate(FIRST_MAP_DIR_OFFSET + MapLumpType.BLOCKMAP, E1M1_BLOCKMAP)
	})
})

describe('map-parser#findNextMapDir', () => {
	const nextDirEi = getAllDirsOp().map(dirs => TF.findNextMapStartingDir(dirs))
	const nextDir = nextDirEi.get()

	it('Validate Next Dir ', () => {
		expect(nextDirEi.isRight).toBeTruthy()
	})

	it('E1M1', () => {
		const mapDir = nextDir(0).get()
		expect(mapDir.name).toEqual('E1M1')
	})

	it('E1M2', () => {
		const mapDir = nextDir(17).get()
		expect(mapDir.name).toEqual('E1M2')
	})

	it('E1M9', () => {
		const mapDir = nextDir(90).get()
		expect(mapDir.name).toEqual('E1M9')
	})

	it('Not found', () => {
		const mapDir = nextDir(9000)
		expect(mapDir.isLeft()).toBeTruthy()
	})

	it('Loop', () => {
		let offs = 0
		for (let i = 0; i < 8; i++) {
			const mapDir = nextDir(offs).get()
			expect(mapDir.name).toEqual('E1M' + (i + 1))
			offs = mapDir.idx + 1
		}
	})
})

describe('map-parser#isMapName', () => {

	it('MAPxx', () => {
		expect(TF.isMapName('MAP01')).toBe(true)
		expect(TF.isMapName('MAP03')).toBe(true)
		expect(TF.isMapName('MAP23')).toBe(true)
		expect(TF.isMapName('MAP32')).toBe(true)

		expect(TF.isMapName('MA32')).toBe(false)
		expect(TF.isMapName('_MA32')).toBe(false)
		expect(TF.isMapName('32')).toBe(false)
	})

	it('ExMy', () => {
		expect(TF.isMapName('ExMy')).toBe(true)
		expect(TF.isMapName('E1M1')).toBe(true)
		expect(TF.isMapName('E2M3')).toBe(true)

		expect(TF.isMapName('E23')).toBe(false)
		expect(TF.isMapName('E23M1')).toBe(false)
		expect(TF.isMapName('E02M01')).toBe(false)
	})

})

describe('sprite_parser#findNextMapDir', () => {
	const finder = TF.findNextMapStartingDir(getAllDirs())

	it('E1M1', () => {
		expect(finder(0).get().name).toEqual('E1M1')
	})

	it('E1M2', () => {
		expect(finder(15).get().name).toEqual('E1M2')
	})

	it('E1M3', () => {
		expect(finder(25).get().name).toEqual('E1M3')
	})

	it('E1M7', () => {
		expect(finder(70).get().name).toEqual('E1M7')
	})

	it('No More Maps', () => {
		expect(finder(90).isLeft).toBeTruthy()
	})

})

describe('map-parser#parseMapDirs', () => {
	const finder = TF.findNextMapStartingDir(getAllDirs())

	it('E1M1', () => {
		const e1m1 = finder(0).get()
		const dirs = TF.parseMapDirs(getAllDirs())(e1m1).get()
		validateE1M1Dirs(dirs)
	})


	it('E1M7', () => {
		const e1m7 = finder(70).get()
		const dirs = TF.parseMapDirs(getAllDirs())(e1m7).get()
		expect(dirs[MapLumpType.MAP_NAME].name).toEqual('E1M7')
		expect(dirs[MapLumpType.SIDEDEFS].name).toEqual('SIDEDEFS')
		expect(dirs[MapLumpType.BLOCKMAP].name).toEqual('BLOCKMAP')
	})

})

describe('map-parser#findAllMapStartDirs', () => {
	const dirs: Directory[] = TF.findAllMapStartDirs(getAllDirs())
	it('E1M1', () => {
		expect(dirs[0].name).toEqual('E1M1')
	})

	it('E1M2', () => {
		expect(dirs[1].name).toEqual('E1M2')
	})

	it('E1M3', () => {
		expect(dirs[2].name).toEqual('E1M3')
	})

	it('E1M4', () => {
		expect(dirs[3].name).toEqual('E1M4')
	})

	it('E1M5', () => {
		expect(dirs[4].name).toEqual('E1M5')
	})

	it('E1M6', () => {
		expect(dirs[5].name).toEqual('E1M6')
	})

	it('E1M7', () => {
		expect(dirs[6].name).toEqual('E1M7')
	})

	it('E1M8', () => {
		expect(dirs[7].name).toEqual('E1M8')
	})

	it('E1M9', () => {
		expect(dirs[8].name).toEqual('E1M9')
	})
})

describe('map-parser#parseMap', () => {
	const map: DoomMap = TF.parseMap(getWadBytes(), TF.createTextureLoader(getTextures()), TF.createFlatLoader(getFlats()))(getE1M1Dirs())

	it('Map name', () => {
		expect(map.mapName).toEqual('E1M1')
	})

	it('Map Dirs', () => {
		validateE1M1Dirs(map.mapDirs)
	})

	it('First Linedef', () => {
		validateLindedef0(map.linedefs[0])
	})

	it('Third Linedef', () => {
		validateLindedef2(map.linedefs[2])
	})

	it('27th Linedef', () => {
		validateLindedef26(map.linedefs[26])
	})

	it('First Thing', () => {
		validateFirstThing(map.things[0])
	})

	it('Second Thing', () => {
		validateThirdThing(map.things[2])
	})

	it('Last Thing', () => {
		validateLastThing(map.things[map.things.length - 1])
	})

	it('Things Amount', () => {
		expect(map.things.length).toEqual(138)
	})

})

describe('map-parser#parseMapsDirs', () => {
	const dirs: Directory[] = TF.findAllMapStartDirs(getAllDirs())
	const all: Directory[][] = TF.parseMapsDirs(getAllDirs(), dirs)

	it('Maps Found', () => {
		expect(all.length).toEqual(9)
	})

	it('E1M1', () => {
		validateE1M1Dirs(all[0])
	})

	it('Validate Each Map Dirs', () => {
		all.forEach(validateMapDirs)
	})

})

describe('map-parser#parseMaps', () => {
	const maps: DoomMap[] = getMaps()

	it('Maps Found', () => {
		expect(maps.length).toEqual(9)
	})

	it('E1M1', () => {
		validateE1M1Dirs(maps[0].mapDirs)
	})

	it('Validate Each Map Dirs', () => {
		maps.map(m => m.mapDirs).forEach(validateMapDirs)
	})


	it('Linedefs belong to same sector', () => {
		maps.forEach(map => {
			map.flatBySector.forEach(lbs => {
				const sectorId = lbs.sector.id
				lbs.linedefs.forEach(ld => {
					if (ld.backSide.isLeft()) {
						expect(ld.sector.id).toEqual(sectorId)
					} else if (ld.sector.id != sectorId) {
						expect(ld.backSide.get().sector.id).toEqual(sectorId)
					}
				})
			})
		})
	})
})


describe('map-parser#scalePos', () => {
	const scale = TF.scalePos(4)(3)

	it('0', () => {
		expect(scale(1)).toEqual(1); // (3 + 1)/4 = 1
	})

	it('2', () => {
		expect(scale(20)).toEqual(6)
	})

	it('8', () => {
		expect(scale(80)).toEqual(21)
	})

})

describe('map-parser#normalizeLinedefs', () => {
	const defs: Linedef[] = getMaps()[0].linedefs
	const nt = (scale: number) => (xy: boolean) => R.reduce(R.max, Number.MIN_SAFE_INTEGER, MP.normalizeLinedefs(scale)(defs).map(d => xy ? d.start.x : d.start.y))

	it('Matching sectorId ID', () => {
		defs.forEach(ld => expect(ld.sector.id).toEqual(ld.frontSide.sector.id))
	})

	it('Positive values', () => {
		MP.normalizeLinedefs(3)(defs).forEach(ld => {
			expect(ld.start.x).toBeGreaterThanOrEqual(0)
			expect(ld.start.y).toBeGreaterThanOrEqual(0)
			expect(ld.end.x).toBeGreaterThanOrEqual(0)
			expect(ld.end.y).toBeGreaterThanOrEqual(0)
		})
	})

	it('Max values for 2x', () => {
		const nt3 = nt(2)
		expect(nt3(true)).toEqual(2288)
		expect(nt3(false)).toEqual(1408)
	})

	it('Max values for 3x', () => {
		const nt3 = nt(3)
		expect(nt3(true)).toEqual(1525)
		expect(nt3(false)).toEqual(939)
	})


	it('Max values for 10x', () => {
		const nt3 = nt(10)
		expect(nt3(true)).toEqual(458)
		expect(nt3(false)).toEqual(282)
	})
})

describe('map-parser#parseSector', () => {
	const parser = TF.parseSector(getWadBytes(), getE1M1Dirs()[MapLumpType.SECTORS], TF.createFlatLoader(getFlats()))

	it('E1M1 - Sector nr: 0', () => {
		validateSectorE1M1_0(parser(0))
	})

	it('E1M1 - Sector nr: 1', () => {
		validateSectorE1M1_1(parser(1))
	})

	it('E1M1 - Sector nr: 4', () => {
		validateSectorE1M1_4(parser(4))
	})
})


describe('map-parser#parseSectors', () => {
	const sectors: Sector[] = TF.parseSectors(getWadBytes())(getE1M1Dirs(), TF.createFlatLoader(getFlats()))

	it('E1M1 - Sector nr: 0', () => {
		validateSectorE1M1_0(sectors[0])
	})

	it('E1M1 - Sector nr: 1', () => {
		validateSectorE1M1_1(sectors[1])
	})

	it('E1M1 - Sector nr: 4', () => {
		validateSectorE1M1_4(sectors[4])
	})

	it('E1M1 - sectorId number', () => {
		sectors.forEach((s: Sector, idx: number) => expect(s.id).toEqual(idx))
	})

})

describe('map-parser#groupBySectorArray', () => {
	const sectors: Sector[] = TF.parseSectors(getWadBytes())(getE1M1Dirs(), TF.createFlatLoader(getFlats()))
	const vertexes = TF.parseVertexes(getWadBytes())(getE1M1Dirs())
	const sidedefs = TF.parseSidedefs(getWadBytes(), TF.createTextureLoader(getTextures()))(getE1M1Dirs(), getE1M1Sectors())
	const linedefs = TF.parseLinedefs(getWadBytes(), getE1M1Dirs(), vertexes, sidedefs, getE1M1Sectors())
	const gr: Linedef[][] = TF.groupBySectorArray(linedefs)

	it('No duplicates', () => {
		const found = new Set<number>()
		const info = {}
		gr.forEach((ld, idx) => {
			const sid = ld[0].sector.id
			expect(found.has(sid)).toBe(false, 'Duplicated sectorId:' + sid + ' on:' + idx + ' and:' + info[sid])
			found.add(sid)
			info[sid] = idx
		})
	})

	it('Sectors size', () => {
		expect(gr.length).toEqual(78)
	})

	it('No empty sectors', () => {
		gr.forEach(ld => {
			expect(ld.length).toBeGreaterThan(0)
		})
	})

	it('Sectors in one group has the same number', () => {
		gr.forEach(ld => {
			const st = ld[0].sector.id
			ld.forEach(ld => {
				expect(ld.sector.id).toEqual(st)
			})
		})
	})

	it('Each #sectorId within #sectors[]', () => {
		gr.forEach(ld => {
			ld.forEach(ld => {
				expect(ld.sector.id).toBeLessThan(sectors.length)
				expect(ld.sector.id).toBeGreaterThanOrEqual(0)
			})
		})
	})

	it('Walls amount', () => {
		let cnt = 0
		gr.forEach(ld => {
			cnt += ld.length
		})
		expect(cnt).toBe(475)
	})

})

describe('map-parser#groupLinedefsBySectors', () => {
	const vertexes = TF.parseVertexes(getWadBytes())(getE1M1Dirs())
	const sidedefs = TF.parseSidedefs(getWadBytes(), TF.createTextureLoader(getTextures()))(getE1M1Dirs(), getE1M1Sectors())
	const linedefs = TF.parseLinedefs(getWadBytes(), getE1M1Dirs(), vertexes, sidedefs, getE1M1Sectors())
	const gr: LinedefBySector[] = TF.buildFlatsBySectors(linedefs, getE1M1Sectors())

	it('Sectors size on E1M1', () => {
		let found = 0
		for (const ldId in gr) {
			found++
		}
		expect(found).toEqual(85)
	})

	it('Sectors in one group has the same number', () => {
		gr.forEach(lbs => {
			lbs.linedefs.forEach(ld => {
				const sectorId = lbs.sector.id
				if (ld.backSide.isLeft()) {
					expect(ld.sector.id).toEqual(sectorId)
				} else if (ld.sector.id != sectorId) {
					expect(ld.backSide.get().sector.id).toEqual(sectorId)
				}
			})
		})
	})

	it('IDs', () => {
		const foundLinedefs = new Set<number>()
		gr.forEach(lbs => {
			foundLinedefs.add(lbs.sector.id)
		})
		expect(foundLinedefs.size).toEqual(85)
	})

})

describe('map-parser#parseFlags', () => {
	it('Bit 1', () => {
		const flags = TF.parseFlags(1)
		expect(flags.size).toEqual(1)
		expect(flags.has(LinedefFlag.BLOCKS_PLAYERS_MONSTERS)).toBeTrue()
	})

	it('Bit 1,2', () => {
		const flags = TF.parseFlags(0x3)
		expect(flags.size).toEqual(2)
		expect(flags.has(LinedefFlag.BLOCKS_PLAYERS_MONSTERS)).toBeTrue()
		expect(flags.has(LinedefFlag.BLOCKS_MONSTERS)).toBeTrue()
	})

	it('Bit 1,2,5', () => {
		const flags = TF.parseFlags(0x13)
		expect(flags.size).toEqual(3)
		expect(flags.has(LinedefFlag.BLOCKS_PLAYERS_MONSTERS)).toBeTrue()
		expect(flags.has(LinedefFlag.BLOCKS_MONSTERS)).toBeTrue()
		expect(flags.has(LinedefFlag.LOWER_TEXTURE_UNPEGGED)).toBeTrue()
	})

	it('Bit 2,5,8', () => {
		const flags = TF.parseFlags(0x92)
		expect(flags.size).toEqual(3)
		expect(flags.has(LinedefFlag.BLOCKS_MONSTERS)).toBeTrue()
		expect(flags.has(LinedefFlag.LOWER_TEXTURE_UNPEGGED)).toBeTrue()
		expect(flags.has(LinedefFlag.NEVER_SHOWS_ON_AUTOMAP)).toBeTrue()
	})

	it('Bit 2,5,9', () => {
		const flags = TF.parseFlags(0x112)
		expect(flags.size).toEqual(3)
		expect(flags.has(LinedefFlag.BLOCKS_MONSTERS)).toBeTrue()
		expect(flags.has(LinedefFlag.LOWER_TEXTURE_UNPEGGED)).toBeTrue()
		expect(flags.has(LinedefFlag.ALWAYS_SHOWS_ON_AUTOMAP)).toBeTrue()
	})

	it('Bit 1,2,5,9', () => {
		const flags = TF.parseFlags(0x93)
		expect(flags.size).toEqual(4)
		expect(flags.has(LinedefFlag.BLOCKS_PLAYERS_MONSTERS)).toBeTrue()
		expect(flags.has(LinedefFlag.BLOCKS_MONSTERS)).toBeTrue()
		expect(flags.has(LinedefFlag.LOWER_TEXTURE_UNPEGGED)).toBeTrue()
		expect(flags.has(LinedefFlag.NEVER_SHOWS_ON_AUTOMAP)).toBeTrue()
	})

	it('Bit 8', () => {
		const flags = TF.parseFlags(0x100)
		expect(flags.size).toEqual(1)
		expect(flags.has(LinedefFlag.ALWAYS_SHOWS_ON_AUTOMAP)).toBeTrue()
	})

	it('All bits set', () => {
		const flags = TF.parseFlags(0x1FF)
		expect(flags.size).toEqual(9)
	})
})

describe('map-parser#findBacksidesBySector', () => {
	const finder = TF.findBacksidesBySector(TF.findBackLinedefs(getE1M1Linedefs()))

	it('E1M1 - Sector nr: 35', () => {
		const sd = finder(35)
		expect(sd.get().length).toEqual(4)
	})

	it('E1M1 - Sector nr: 24', () => {
		const sd = finder(24)
		expect(sd.isLeft).toBeTruthy()
	})

	it('E1M1 - Sector nr: 41', () => {
		const sd = finder(41)
		expect(sd.get().length).toEqual(1)
	})

	it('E1M4 - Sector nr: 50 (only backsides)', () => {
		expect(TF.findBacksidesBySector(TF.findBackLinedefs(getMaps()[3].linedefs))(50).get().length).toEqual(25)
	})

})

describe('map-parser#findLastNotConnected', () => {

	it('Mixed', () => {
		const ret = TF.findLastNotConnected(PATH_CLOSED_MIXED)
		expect(ret.get()).toEqual(8)
	})

	it('Sorted', () => {
		const ret = TF.findLastNotConnected(PATH_CLOSED_SORTED)
		expect(ret.isLeft()).toBeTrue()
	})

})

describe('map-parser#findMaxSectorId', () => {

	it('E1M1 - LD', () => {
		expect(TF.findMaxSectorId(getE1M1Linedefs())).toEqual(84)
	})

	it('E1M1', () => {
		expect(TF.findMaxSectorId(getMaps()[0].linedefs)).toEqual(84)
	})

	it('E1M4', () => {
		expect(TF.findMaxSectorId(getMaps()[3].linedefs)).toEqual(138)
	})
})


