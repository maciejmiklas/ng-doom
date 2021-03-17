import {Either} from './either';

class TwoStrings {
	public vv: string | undefined;
	public pp: string | undefined;

	static create(vv: string, pp: string): TwoStrings {
		const ts = new TwoStrings();
		ts.vv = vv;
		ts.pp = pp;
		return ts;
	}

	public toString = (): string => {
		return `TwoStrings [vv: ${this.vv}, pp: ${this.pp}]`;
	}
}

class OneString {
	constructor(public vv: string) {
	}

	public toString = (): string => {
		return `OneString [vv: ${this.vv}]`;
	}
}

function getNullOrNumber(): number | null {
	return null;
}

function getNullOrString(): string | null {
	return null;
}

describe('Either.append', () => {
	it('Append to from Right to Right', () => {
		const res = Either.ofRight({vv: '123'})
			.remap(() => Either.ofRight(new TwoStrings()), (v, t) => {
				v.vv = t.vv;
			})
			.append(v => Either.ofRight(v.vv + '-abc'), (t, v) => t.pp = v);

		const actual = res.get();
		expect(actual.vv).toEqual('123');
		expect(actual.pp).toEqual('123-abc');
	});

	it('Append to from Right to Left', () => {
		const res = Either.ofRight({vv: '123'})
			.remap(() => Either.ofRight(new TwoStrings()), (v, t) => {
				v.vv = t.vv;
			})
			.append(v => Either.ofCondition(() => false, () => 'left!', () => v.vv + '-abc'), (t, v) => t.pp = v);

		expect(res.isLeft()).toBeTruthy();
	});

	it('Append to from Left to Right', () => {
		const ei = Either.ofCondition(() => false, () => 'left!', () => new TwoStrings());
		const res = ei.append(v => Either.ofRight(v.vv + '-abc'), (t, v) => t.pp = v);
		expect(res.isLeft()).toBeTruthy();
	});
});

describe('Either.exec', () => {
	const nil = Either.ofNullable(null, () => 'just null!');
	const of = Either.ofRight(101);

	it('from null', () => {
		expect(nil.exec((v) => {
			expect(v).toBeNull();
		}).isLeft()).toBeTruthy();
	});

	it('from value', () => {
		expect(of.exec((v) => {
			expect(v).toEqual(101);
		}).get()).toEqual(101);
	});

});

describe('Either.ofTruth', () => {
	const falsy1 = Either.ofCondition(() => false, () => 'cond false 1', () => 98);
	const falsy2 = Either.ofCondition(() => false, () => 'cond false 2', () => 97);
	const truthy1 = Either.ofCondition(() => true, () => 'cond true', () => 99);
	const truthy2 = Either.ofCondition(() => true, () => 'cond true', () => 21);

	it('Falsy', () => {
		const val = Either.ofTruth([falsy1, falsy2, truthy1, truthy2], () => 101);
		expect(val.isLeft()).toBeTruthy();
		expect(val.message()).toEqual('cond false 1,cond false 2');
	});

	it('Truthy', () => {
		const val = Either.ofTruth([truthy1, truthy2], () => 101);
		expect(val.isRight()).toBeTruthy();
		expect(val.get()).toEqual(101);
	});
});

describe('Either.toString', () => {
	const nil = Either.ofNullable(null, () => 'just null!');
	const of = Either.ofRight(101);
	const nn = Either.ofNullable(100, () => 'test 100');

	it('from null', () => {
		expect(nil.toString()).toBe('Left[just null!]');
	});

	it('from nullable value', () => {
		expect(nn.toString()).toBe('Right[100]');
	});

	it('from value', () => {
		expect(of.toString()).toBe('Right[101]');
	});

	it('from value and map', () => {
		expect(of.map(v => v + 2).toString()).toBe('Right[103]');
	});
});

describe('Either.orElse', () => {
	const nil = Either.ofNullable(getNullOrString(), () => 'just null!');
	const of = Either.ofRight(101);
	const nn = Either.ofNullable(100, () => 'test 100');

	it('from null', () => {
		expect(nil.orElse('test 222')).toBe('test 222');
	});

	it('from nullable value', () => {
		expect(nn.orElse(99)).toBe(100);
	});

	it('from value', () => {
		expect(of.orElse(99)).toBe(101);
	});
});

describe('Either.orElseGet', () => {
	const nil = Either.ofNullable(getNullOrString(), () => 'just null!');
	const of = Either.ofRight(101);
	const nn = Either.ofNullable(100, () => 'test 100');

	it('from null', () => {
		expect(nil.orElseGet(() => 'test 222')).toBe('test 222');
	});

	it('from nullable value', () => {
		expect(nn.orElseGet(() => 99)).toBe(100);
	});

	it('from value', () => {
		expect(of.orElseGet(() => 99)).toBe(101);
	});
});

describe('Either.map', () => {
	const nil = Either.ofNullable(getNullOrNumber(), () => 'just null!');
	const nn = Either.ofNullable(100, () => 'test 100');

	it('null', () => {
		// @ts-ignore
		expect(nil.map(v => v + 1).isLeft()).toBeTruthy();
	});

	it('map to null', () => {
		expect(nn.map(v => null).isLeft()).toBeTruthy();
	});

	it('map to same type', () => {
		expect(nn.map(v => v + 1).get()).toEqual(101);
	});

	it('map to different type', () => {
		expect(nn.map(v => 'v_' + v).get()).toEqual('v_100');
	});

	it('map to function', () => {
		expect(nn.map(v => () => v + 122).get()()).toEqual(222);
	});
});

describe('Either.ofNullable', () => {
	const nil = Either.ofNullable(getNullOrNumber(), () => 'just null!');
	const nn = Either.ofNullable(100, () => 'test 100');

	it('from null - isLeft', () => {
		expect(nil.isLeft()).toBeTruthy();
	});

	it('from null - isRight', () => {
		expect(nil.isRight()).toBeFalsy();
	});

	it('from null - get', () => {
		expect(() => nil.get()).toThrowError(TypeError);
	});

	it('from null - map', () => {
		// @ts-ignore
		expect(nil.map(v => v + 1).isLeft).toBeTruthy();
	});

	it('from null - map - get', () => {
		// @ts-ignore
		expect(() => nil.map(v => v + 1).get()).toThrowError(TypeError);
	});

	it('from number - isLeft', () => {
		expect(nn.isLeft()).toBeFalsy();
	});

	it('from number - isRight', () => {
		expect(nn.isRight()).toBeTruthy();
	});

	it('from number - get', () => {
		expect(nn.get()).toBe(100);
	});

	it('from number - map', () => {
		expect(nn.map(v => v + 1).get()).toBe(101);
	});
});

describe('Either.of', () => {
	const str = Either.ofRight('123');
	it('isLeft', () => {
		expect(str.isLeft()).toBeFalsy();
	});

	it('isRight', () => {
		expect(str.isRight()).toBeTruthy();
	});

	it('map simple type', () => {
		const ei = Either.ofRight(10).map(v => v + 1);
		expect(ei.isRight()).toBeTruthy();
		expect(ei.get()).toBe(11);
	});
});

describe('Either.ofLeft', () => {
	const left = Either.ofLeft('123') as Either<number>;

	it('isLeft', () => {
		expect(left.isLeft()).toBeTruthy();
	});

	it('isRight', () => {
		expect(left.isRight()).toBeFalsy();
	});

	it('message', () => {
		expect(left.message()).toBe('123');
	});

	it('map simple type', () => {
		const ei = left.map(v => v + 1);
		expect(left.isLeft()).toBeTruthy();
		expect(ei.message()).toBe('123');
	});
});

describe('Either.remap', () => {
	it('Remap from Right to Right', () => {
		const res = Either.ofRight({vv: '123'}).remap(() => Either.ofRight(new TwoStrings()), (v, t) => v.vv = t.vv);
		expect(res.get().vv).toEqual('123');
	});

	it('Remap from Right to Left', () => {
		const res = Either.ofRight({vv: '123'})
			.remap(val => Either.ofCondition(() => false, () => 'noo', () => new TwoStrings()), (v, t) => v.vv = t.vv);
		expect(res.isLeft()).toBeTrue();
	});

	it('Remap from Left to Right', () => {
		const res = Either.ofCondition<OneString>(() => false, () => 'noo', () => new OneString('start'))
			.remap(() => Either.ofRight(new TwoStrings()), (v: any, t: any) => v.vv = t.vv);
		expect(res.isLeft()).toBeTruthy();
	});

});

describe('Either.ofArray', () => {
	it('All Left', () => {
		const res = Either.ofArray(Either.ofLeft('l1'), Either.ofLeft('l2'), Either.ofLeft('l3'));
		expect(res.isLeft()).toBeTruthy();
	});

	it('All Right', () => {
		const res = Either.ofArray(Either.ofRight(1), Either.ofRight(10), Either.ofRight(3));
		expect(res.isRight()).toBeTruthy();
		expect(res.get()).toEqual([1, 10, 3]);
	});

	it('Mix', () => {
		const res = Either.ofArray(Either.ofRight(1), Either.ofLeft('l2'), Either.ofRight(10), Either.ofRight(3));
		expect(res.isRight()).toBeTruthy();
		expect(res.get()).toEqual([1, 10, 3]);
	});

});

describe('Either.unitl', () => {
	it('number array', () => {
		const res = Either.until<number>(v => Either.ofCondition(() => v < 5, () => 'End', () => v + 1), Either.ofRight(0)).get();
		expect(res).toEqual([0, 1, 2, 3, 4, 5]);
	});

	it('empty result', () => {
		const res = Either.until<number>(v => Either.ofCondition(() => false, () => 'End', () => v + 1), Either.ofLeft('LEFT'));
		expect(res.isLeft()).toBeTruthy();
	});
});

describe('Either.ofCondition', () => {
	const falsyInt = Either.ofCondition(() => false, () => 'cond false', () => 98);
	const truthyInt = Either.ofCondition(() => true, () => 'cond true', () => 99);

	const falsyObj = Either.ofCondition(() => false, () => 'cond false', () => new OneString('False!'));
	const truthyObj = Either.ofCondition(() => true, () => 'cond true', () => new OneString('True!'));

	it('falsyObj - isLeft', () => {
		expect(falsyObj.isLeft()).toBeTruthy();
		const map = falsyObj.map(v => v.vv = 'mapped!');
		expect(map.isLeft).toBeTruthy();
		expect(map.toString()).toEqual('Left[cond false]');
	});

	it('falsyObj - toString', () => {
		expect(falsyObj.toString()).toEqual('Left[cond false]');
	});

	it('falsyObj - isRight', () => {
		expect(falsyObj.isRight()).toBeFalsy();
	});

	it('truthyObj - isLeft', () => {
		expect(truthyObj.isLeft()).toBeFalsy();
	});

	it('truthyObj - isRight', () => {
		expect(truthyObj.isRight()).toBeTruthy();
	});

	it('truthyObj - toString', () => {
		expect(truthyObj.toString()).toEqual('Right[OneString [vv: True!]]');
	});

	it('truthyObj - get', () => {
		expect(truthyObj.get().vv).toEqual('True!');
	});

	it('truthyObj - map', () => {
		expect(truthyObj.map(v => 'mapped!').get()).toEqual('mapped!');
	});

	it('falsyInt - isLeft', () => {
		expect(falsyInt.isLeft()).toBeTruthy();
	});

	it('falsyInt - isRight', () => {
		expect(falsyInt.isRight()).toBeFalsy();
	});

	it('falsyInt - toString', () => {
		expect(falsyInt.toString()).toEqual('Left[cond false]');
	});

	it('falsyInt - get', () => {
		expect(() => falsyInt.get()).toThrowError(TypeError);
	});

	it('truthyInt - isLeft', () => {
		expect(truthyInt.isLeft()).toBeFalsy();
	});

	it('truthyInt - isRight', () => {
		expect(truthyInt.isRight()).toBeTruthy();
	});

	it('truthyInt - toString', () => {
		expect(truthyInt.toString()).toEqual('Right[99]');
	});

	it('truthyInt - get', () => {
		expect(truthyInt.get()).toEqual(99);
	});
});
