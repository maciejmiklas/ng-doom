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
import U from './util'
import * as R from 'ramda'

const IWAD_STR = [73, 87, 65, 68]; // IWAD
const BROWN98_STR = [66, 82, 79, 87, 78, 57, 56, 45, 65]; // BROWN96-A
const ARR = R.range(0, 5000)

describe('util#parseUint32', () => {

	it('8', () => {
		expect(U.parseUint32([0x8, 0x00, 0x00, 0x00])(0)).toEqual(8)
	})

	it('12', () => {
		expect(U.parseUint32([0x0C, 0x00, 0x00, 0x00])(0)).toEqual(12)
	})

	it('12 - offset', () => {
		ARR[100] = 0x0C
		ARR[101] = 0x00
		ARR[102] = 0x00
		ARR[103] = 0x00
		expect(U.parseUint32(ARR)(100)).toEqual(12)
	})

	it('128', () => {
		expect(U.parseUint32([0x80, 0x00, 0x00, 0x00])(0)).toEqual(128)
	})

	it('2 048', () => {
		expect(U.parseUint32([0x00, 0x8, 0x00, 0x00])(0)).toEqual(2048)
	})

	it('max', () => {
		expect(U.parseUint32([0x00, 0x80, 0x00, 0x00])(0, 500)).toEqual(0)
	})

	it('32 768', () => {
		expect(U.parseUint32([0x00, 0x80, 0x00, 0x00])(0)).toEqual(32768)
	})

	it('65 535', () => {
		expect(U.parseUint32([0xFF, 0xFF, 0x00, 0x00])(0)).toEqual(65535)
	})

	it('65 535 - offset', () => {
		ARR[1000] = 0xFF
		ARR[1001] = 0xFF
		ARR[1002] = 0x00
		ARR[1003] = 0x00
		expect(U.parseUint32(ARR)(1000)).toEqual(65535)
	})

	it('1 048 575', () => {
		expect(U.parseUint32([0xFF, 0xFF, 0xF, 0x00])(0)).toEqual(1048575)
	})

	it('16 777 215', () => {
		expect(U.parseUint32([0xFF, 0xFF, 0xFF, 0x00])(0)).toEqual(16777215)
	})

	it('268 435 455', () => {
		expect(U.parseUint32([0xFF, 0xFF, 0xFF, 0xF])(0)).toEqual(268435455)
	})

	it('4 294 967 295', () => {
		expect(U.parseUint32([0xFF, 0xFF, 0xFF, 0xFF])(0)).toEqual(4294967295)
	})

	it('4 026 531 840', () => {
		expect(U.parseUint32([0x00, 0x00, 0x00, 0xF0])(0)).toEqual(4026531840)
	})

	it('251 658 240', () => {
		expect(U.parseUint32([0x00, 0x00, 0x00, 0xF])(0)).toEqual(251658240)
	})

	it('134 217 728', () => {
		expect(U.parseUint32([0x00, 0x00, 0x00, 0x8])(0)).toEqual(134217728)
	})

	it('2 147 483 648', () => {
		expect(U.parseUint32([0x00, 0x00, 0x00, 0x80])(0)).toEqual(2147483648)
	})

	it('3 221 225 472', () => {
		expect(U.parseUint32([0x00, 0x00, 0x00, 0xC0])(0)).toEqual(3221225472)
	})

	it('201 326 592', () => {
		expect(U.parseUint32([0x00, 0x00, 0x00, 0xC])(0)).toEqual(201326592)
	})

	it('4 294 967 295', () => {
		expect(U.parseUint32([0xFF, 0xFF, 0xFF, 0xFF])(0)).toEqual(4294967295)
	})

	it('4 294 967 295 - offset', () => {
		ARR[1000] = 0xFF
		ARR[1001] = 0xFF
		ARR[1002] = 0xFF
		ARR[1003] = 0xFF
		expect(U.parseUint32(ARR)(1000)).toEqual(4294967295)
	})

	it('2 147 483 648', () => {
		expect(U.parseUint32([0x00, 0x00, 0x00, 0x80])(0)).toEqual(2147483648)
	})

	it('2 290 649 224', () => {
		expect(U.parseUint32([0x88, 0x88, 0x88, 0x88])(0)).toEqual(2290649224)
	})

})

describe('util#parseInt32', () => {
	it('12', () => {
		expect(U.parseInt32([0x0C, 0x00, 0x00, 0x00])(0)).toEqual(12)
	})

	it('12 - offset', () => {
		ARR[1000] = 0x0C
		ARR[1001] = 0x00
		ARR[1002] = 0x00
		ARR[1003] = 0x00
		expect(U.parseInt32(ARR)(1000)).toEqual(12)
	})

	it('1234567898', () => {
		expect(U.parseInt32([0xDA, 0x02, 0x96, 0x49])(0)).toEqual(1234567898)
	})

	it('1234567898 - offset', () => {
		ARR[2220] = 0xDA
		ARR[2221] = 0x02
		ARR[2222] = 0x96
		ARR[2223] = 0x49
		expect(U.parseInt32(ARR)(2220)).toEqual(1234567898)
	})

	it('-999912', () => {
		expect(U.parseInt32([0x18, 0xBE, 0xF0, 0xFF])(0)).toEqual(-999912)
	})

	it('-12', () => {
		expect(U.parseInt32([0xF4, 0xFF, 0xFF, 0xFF])(0)).toEqual(-12)
	})

	it('-5', () => {
		expect(U.parseInt32([0xFB, 0xFF, 0xFF, 0xFF])(0)).toEqual(-5)
	})

	it('1', () => {
		expect(U.parseInt32([0x01, 0x00, 0x00, 0x00])(0)).toEqual(1)
	})

	it('-1', () => {
		expect(U.parseInt32([0xFF, 0xFF, 0xFF, 0xFF])(0)).toEqual(-1)
	})

	it('-2', () => {
		expect(U.parseInt32([0xFE, 0xFF, 0xFF, 0xFF])(0)).toEqual(-2)
	})

	it('2 147 483 647', () => {
		expect(U.parseInt32([0xFF, 0xFF, 0xFF, 0x7F])(0)).toEqual(2147483647)
	})

	it('-2 130 706 433', () => {
		expect(U.parseInt32([0xFF, 0xFF, 0xFF, 0x80])(0)).toEqual(-2130706433)
	})

	it('5', () => {
		expect(U.parseInt32([0x05, 0x00, 0x00, 0x00])(0)).toEqual(5)
	})

	it('-4160', () => {
		expect(U.parseInt32([0xC0, 0xEF, 0xFF, 0xFF])(0)).toEqual(-4160)
	})

	it('-10000000', () => {
		expect(U.parseInt32([0x80, 0x69, 0x67, 0xFF])(0)).toEqual(-10000000)
	})

})

describe('util#parseInt16', () => {
	it('12', () => {
		expect(U.parseInt16([0x0C, 0x00])(0)).toEqual(12)
	})

	it('12 offset', () => {
		expect(U.parseInt16([0xFF, 0xFF, 0x0C, 0x00, 0x00, 0x00, 0xFF])(2)).toEqual(12)
	})

	it('4160', () => {
		expect(U.parseInt16([0x40, 0x10])(0)).toEqual(4160)
	})

	it('-12', () => {
		expect(U.parseInt16([0xF4, 0xFF])(0)).toEqual(-12)
	})

	it('-1', () => {
		expect(U.parseInt16([0xFF, 0xFF])(0)).toEqual(-1)
	})

	it('-5', () => {
		expect(U.parseInt16([0xFB, 0xFF])(0)).toEqual(-5)
	})

	it('1', () => {
		expect(U.parseInt16([0x01, 0x00])(0)).toEqual(1)
	})

	it('5', () => {
		expect(U.parseInt16([0x05, 0x00])(0)).toEqual(5)
	})

	it('-4160', () => {
		expect(U.parseInt16([0xC0, 0xEF])(0)).toEqual(-4160)
	})
})

describe('util#parseUint16', () => {
	it('12', () => {
		expect(U.parseUint16([0x0C, 0x00])(0)).toEqual(12)
	})

	it('12 offset', () => {
		expect(U.parseUint16([0xFF, 0xFF, 0x0C, 0x00, 0x00, 0x00, 0xFF])(2)).toEqual(12)
	})

	it('4160', () => {
		expect(U.parseUint16([0x40, 0x10])(0)).toEqual(4160)
	})

	it('1', () => {
		expect(U.parseUint16([0x01, 0x00])(0)).toEqual(1)
	})

	it('5', () => {
		expect(U.parseUint16([0x05, 0x00])(0)).toEqual(5)
	})

	it('max', () => {
		expect(U.parseUint16([0xFF, 0xFA])(0, 100)).toEqual(0)
	})

	it('64255', () => {
		expect(U.parseUint16([0xFF, 0xFA])(0)).toEqual(64255)
	})

	it('65535', () => {
		expect(U.parseUint16([0xFF, 0xFF])(0)).toEqual(65535)
	})

})

describe('util#parseUint8', () => {
	it('90 at 0', () => {
		expect(U.parseUint8([0x5A, 0xFF, 0xFF])(0)).toEqual(90)
	})

	it('90 at 1', () => {
		expect(U.parseUint8([0xFF, 0x5A, 0xFF])(1)).toEqual(90)
	})

	it('127', () => {
		expect(U.parseUint8([0x7F])(0)).toEqual(127)
	})

	it('max', () => {
		expect(U.parseUint8([0x7F])(0, 100)).toEqual(0)
	})

	it('128', () => {
		expect(U.parseUint8([0x80])(0)).toEqual(128)
	})

	it('255', () => {
		expect(U.parseUint8([0xFF])(0)).toEqual(255)
	})
})

describe('util#Parse short Opt', () => {
	it('Right', () => {
		expect(U.parseInt16Op([0x0C, 0x00])(v => v > 1, (v) => '?')(0).get()).toEqual(12)
	})

	it('Left', () => {
		const either = U.parseInt16Op([0x0C, 0x00])(v => v > 13, (v) => 'only ' + v)(0)
		expect(either.isLeft()).toBeTruthy()
		expect(either.message()).toEqual('only 12')
	})

})

describe('util#parseStr', () => {
	it('whole', () => {
		expect(U.parseStr(IWAD_STR)(0, 4)).toEqual('IWAD')
	})

	it('sub string', () => {
		expect(U.parseStr(IWAD_STR)(1, 2)).toEqual('WA')
	})

	it('length out of range', () => {
		expect(U.parseStr(IWAD_STR)(0, 5)).toEqual('IWAD')
	})

	it('out of range', () => {
		expect(U.parseStr(IWAD_STR)(6, 2)).toEqual('')
	})
})

describe('util#parseTextureName', () => {
	it('whole', () => {
		expect(U.parseTextureName(IWAD_STR)(0, 4).get()).toEqual('IWAD')
	})

	it('sub string', () => {
		expect(U.parseTextureName(IWAD_STR)(1, 2).get()).toEqual('WA')
	})

	it('length out of range', () => {
		expect(U.parseTextureName(IWAD_STR)(0, 5).get()).toEqual('IWAD')
	})

	it('out of range', () => {
		expect(U.parseTextureName(IWAD_STR)(6, 2).isLeft).toBeTruthy()
	})

	it('BROWN98-A', () => {
		expect(U.parseTextureName(BROWN98_STR)(0, 10).get()).toEqual('BROWN98-A')
	})

	it('-', () => {
		expect(U.parseTextureName([45])(6, 2).isLeft).toBeTruthy()
	})
})

describe('util#parseStrOp', () => {
	it('found', () => {
		expect(U.parseStrOp(IWAD_STR)(str => str === 'IWAD', () => '?')(0, 4).get()).toEqual('IWAD')
	})

	it('not found', () => {
		const either = U.parseStrOp(IWAD_STR)(str => str === 'WAD', () => 'nope')(0, 4)
		expect(either.isLeft()).toBeTruthy()
		expect(either.message()).toEqual('nope')
	})

})

describe('util#its', () => {

	it('iterate', () => {
		let maxIdx = 0
		let loops = 0
		U.its(1, 11, (idx) => idx + 2, idx => {
			maxIdx = idx
			loops++
		})
		expect(maxIdx).toEqual(9)
		expect(loops).toEqual(5)
	})
})

describe('util#itn', () => {

	it('iterate', () => {
		let maxIdx = 0
		let loops = 0
		U.itn(1, 11, idx => {
			maxIdx = idx
			loops++
		})
		expect(maxIdx).toEqual(10)
		expect(loops).toEqual(10)
	})
})


describe('util#findFrom', () => {
	const arr = [1, 2, 4, 66, 5, 23]
	it('found from 0', () => {
		expect(U.findFrom(arr)(0, (val, idx) => val === 4).get()).toEqual(4)
	})

	it('found from 1', () => {
		expect(U.findFrom(arr)(0, (val, idx) => val === 4).get()).toEqual(4)
	})

	it('found from starting', () => {
		expect(U.findFrom(arr)(2, (val, idx) => val === 4).get()).toEqual(4)
	})

	it('found 66', () => {
		expect(U.findFrom(arr)(2, (val, idx) => val === 66).get()).toEqual(66)
	})

	it('not found from 0', () => {
		expect(U.findFrom(arr)(0, (val, idx) => val === 99).isLeft).toBeTruthy()
	})

	it('not found from 5', () => {
		expect(U.findFrom(arr)(5, (val, idx) => val === 99).isLeft).toBeTruthy()
	})
})

describe('util#nullSafeArray', () => {
	it('null', () => {
		expect(U.nullSafeArray(null).length).toEqual(0)
	})

	it('undefined', () => {
		expect(U.nullSafeArray(undefined).length).toEqual(0)
	})

	it('full', () => {
		expect(U.nullSafeArray([1, 2]).length).toEqual(2)
	})
})

describe('util#nextRoll', () => {
	const roll = U.nextRoll([1, 3, 9, 2])

	it('at 0', () => {
		expect(roll(0)).toEqual(1)
	})

	it('at -1', () => {
		expect(roll(-1)).toEqual(2)
	})

	it('at 1', () => {
		expect(roll(1)).toEqual(3)
	})

	it('at 4', () => {
		expect(roll(4)).toEqual(1)
	})
})

describe('util#cs', () => {

	it('Equal, lower case', () => {
		expect(U.cs('the same', 'the same')).toBeTrue()
	})

	it('Equal, upper case', () => {
		expect(U.cs('THE SAME', 'THE SAME')).toBeTrue()
	})

	it('Equal, mixed case', () => {
		expect(U.cs('THE SAME', 'THE same')).toBeTrue()
	})

	it('Equal, trim', () => {
		expect(U.cs(' the same', 'the same ')).toBeTrue()
	})

})




