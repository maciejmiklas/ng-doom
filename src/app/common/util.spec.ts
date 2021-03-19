import U from './util';

const IWAD_STR = [73, 87, 65, 68];

describe('Parse uint', () => {

	it('8', () => {
		expect(U.parseUint([0x8, 0x00, 0x00, 0x00])(0)).toEqual(8);
	});

	it('12', () => {
		expect(U.parseUint([0x0C, 0x00, 0x00, 0x00])(0)).toEqual(12);
	});

	it('128', () => {
		expect(U.parseUint([0x80, 0x00, 0x00, 0x00])(0)).toEqual(128);
	});

	it('2 048', () => {
		expect(U.parseUint([0x00, 0x8, 0x00, 0x00])(0)).toEqual(2048);
	});

	it('32 768', () => {
		expect(U.parseUint([0x00, 0x80, 0x00, 0x00])(0)).toEqual(32768);
	});

	it('65 535', () => {
		expect(U.parseUint([0xFF, 0xFF, 0x00, 0x00])(0)).toEqual(65535);
	});

	it('1 048 575', () => {
		expect(U.parseUint([0xFF, 0xFF, 0xF, 0x00])(0)).toEqual(1048575);
	});

	it('16 777 215', () => {
		expect(U.parseUint([0xFF, 0xFF, 0xFF, 0x00])(0)).toEqual(16777215);
	});

	it('268 435 455', () => {
		expect(U.parseUint([0xFF, 0xFF, 0xFF, 0xF])(0)).toEqual(268435455);
	});

	it('4 294 967 295', () => {
		expect(U.parseUint([0xFF, 0xFF, 0xFF, 0xFF])(0)).toEqual(4294967295);
	});

	it('4 026 531 840', () => {
		expect(U.parseUint([0x00, 0x00, 0x00, 0xF0])(0)).toEqual(4026531840);
	});

	it('251 658 240', () => {
		expect(U.parseUint([0x00, 0x00, 0x00, 0xF])(0)).toEqual(251658240);
	});

	it('134 217 728', () => {
		expect(U.parseUint([0x00, 0x00, 0x00, 0x8])(0)).toEqual(134217728);
	});

	it('2 147 483 648', () => {
		expect(U.parseUint([0x00, 0x00, 0x00, 0x80])(0)).toEqual(2147483648);
	});

	it('3 221 225 472', () => {
		expect(U.parseUint([0x00, 0x00, 0x00, 0xC0])(0)).toEqual(3221225472);
	});

	it('201 326 592', () => {
		expect(U.parseUint([0x00, 0x00, 0x00, 0xC])(0)).toEqual(201326592);
	});

	it('4 294 967 295', () => {
		expect(U.parseUint([0xFF, 0xFF, 0xFF, 0xFF])(0)).toEqual(4294967295);
	});

	it('2 147 483 648', () => {
		expect(U.parseUint([0x00, 0x00, 0x00, 0x80])(0)).toEqual(2147483648);
	});

	it('2 290 649 224', () => {
		expect(U.parseUint([0x88, 0x88, 0x88, 0x88])(0)).toEqual(2290649224);
	});

});

describe('Parse int', () => {
	it('12', () => {
		expect(U.parseInt([0x0C, 0x00, 0x00, 0x00])(0)).toEqual(12);
	});

	it('12 offset', () => {
		expect(U.parseInt([0xFF, 0xFF, 0x0C, 0x00, 0x00, 0x00, 0xFF])(2)).toEqual(12);
	});

	it('1234567898', () => {
		expect(U.parseInt([0xDA, 0x02, 0x96, 0x49])(0)).toEqual(1234567898);
	});

	it('-999912', () => {
		expect(U.parseInt([0x18, 0xBE, 0xF0, 0xFF])(0)).toEqual(-999912);
	});

	it('-12', () => {
		expect(U.parseInt([0xF4, 0xFF, 0xFF, 0xFF])(0)).toEqual(-12);
	});

	it('-5', () => {
		expect(U.parseInt([0xFB, 0xFF, 0xFF, 0xFF])(0)).toEqual(-5);
	});

	it('1', () => {
		expect(U.parseInt([0x01, 0x00, 0x00, 0x00])(0)).toEqual(1);
	});

	it('-1', () => {
		expect(U.parseInt([0xFF, 0xFF, 0xFF, 0xFF])(0)).toEqual(-1);
	});

	it('-2', () => {
		expect(U.parseInt([0xFE, 0xFF, 0xFF, 0xFF])(0)).toEqual(-2);
	});

	it('2 147 483 647', () => {
		expect(U.parseInt([0xFF, 0xFF, 0xFF, 0x7F])(0)).toEqual(2147483647);
	});

	it('-2 130 706 433', () => {
		expect(U.parseInt([0xFF, 0xFF, 0xFF, 0x80])(0)).toEqual(-2130706433);
	});

	it('5', () => {
		expect(U.parseInt([0x05, 0x00, 0x00, 0x00])(0)).toEqual(5);
	});

	it('-4160', () => {
		expect(U.parseInt([0xC0, 0xEF, 0xFF, 0xFF])(0)).toEqual(-4160);
	});

	it('-10000000', () => {
		expect(U.parseInt([0x80, 0x69, 0x67, 0xFF])(0)).toEqual(-10000000);
	});

});

describe('Parse short', () => {
	it('12', () => {
		expect(U.parseShort([0x0C, 0x00])(0)).toEqual(12);
	});

	it('12 offset', () => {
		expect(U.parseShort([0xFF, 0xFF, 0x0C, 0x00, 0x00, 0x00, 0xFF])(2)).toEqual(12);
	});

	it('4160', () => {
		expect(U.parseShort([0x40, 0x10])(0)).toEqual(4160);
	});

	it('-12', () => {
		expect(U.parseShort([0xF4, 0xFF])(0)).toEqual(-12);
	});

	it('-1', () => {
		expect(U.parseShort([0xFF, 0xFF])(0)).toEqual(-1);
	});

	it('-5', () => {
		expect(U.parseShort([0xFB, 0xFF])(0)).toEqual(-5);
	});

	it('1', () => {
		expect(U.parseShort([0x01, 0x00])(0)).toEqual(1);
	});

	it('5', () => {
		expect(U.parseShort([0x05, 0x00])(0)).toEqual(5);
	});

	it('-4160', () => {
		expect(U.parseShort([0xC0, 0xEF])(0)).toEqual(-4160);
	});
});

describe('Parse parseUbyte', () => {
	it('90 at 0', () => {
		expect(U.parseUbyte([0x5A, 0xFF, 0xFF])(0)).toEqual(90);
	});

	it('90 at 1', () => {
		expect(U.parseUbyte([0xFF, 0x5A, 0xFF])(1)).toEqual(90);
	});

	it('127', () => {
		expect(U.parseUbyte([0x7F])(0)).toEqual(127);
	});

	it('128', () => {
		expect(U.parseUbyte([0x80])(0)).toEqual(128);
	});

	it('255', () => {
		expect(U.parseUbyte([0xFF])(0)).toEqual(255);
	});
});

describe('Parse short Opt', () => {
	it('Right', () => {
		expect(U.parseShortOp([0x0C, 0x00])(v => v > 1, (v) => '?')(0).get()).toEqual(12);
	});

	it('Left', () => {
		const either = U.parseShortOp([0x0C, 0x00])(v => v > 13, (v) => 'only ' + v)(0);
		expect(either.isLeft()).toBeTruthy();
		expect(either.message()).toEqual('only 12');
	});

});

describe('Parse string', () => {
	it('whole', () => {
		expect(U.parseStr(IWAD_STR)(0, 4)).toEqual('IWAD');
	});

	it('sub string', () => {
		expect(U.parseStr(IWAD_STR)(1, 2)).toEqual('WA');
	});

	it('length out of range', () => {
		expect(U.parseStr(IWAD_STR)(0, 5)).toEqual('IWAD');
	});

	it('out of range', () => {
		expect(U.parseStr(IWAD_STR)(6, 2)).toEqual('');
	});
});

describe('Parse string Op', () => {
	it('found', () => {
		expect(U.parseStrOp(IWAD_STR)(str => str === 'IWAD', () => '?')(0, 4).get()).toEqual('IWAD');
	});

	it('not found', () => {
		const either = U.parseStrOp(IWAD_STR)(str => str === 'WAD', () => 'nope')(0, 4);
		expect(either.isLeft()).toBeTruthy();
		expect(either.message()).toEqual('nope');
	});

});
