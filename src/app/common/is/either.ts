import * as R from 'ramda';
import {Log} from './log';

export abstract class Either<T> {
	protected readonly val: T;
	protected readonly msg: string;

	protected constructor(value: T, msg: string) {
		this.val = value;
		this.msg = msg;
	}

	static until = <T>(next: (previous: T) => Either<T>, init: Either<T>, max: number = 500): Either<T[]> => {
		let val = init;
		const all: T[] = [];
		let cnt = 0;
		while (val.isRight()) {
			if (cnt > max) {
				Log.error('Either#until', 'Iterations limit of $max reached', {max});
				break;
			}
			val.exec((v) => all.push(v));
			val = next(val.get());
			cnt = cnt + 1;
		}
		return Either.ofCondition(() => all.length > 0, () => 'Empty result for ' + init, () => all);
	};

	static ofArray = <T>(...args: Either<T>[]): Either<T[]> => {
		const ret = args.filter(e => e.isRight()).map(e => e.get());
		return Either.ofCondition(() => ret.length > 0, () => 'All candidates for Array are Left: ' + args, () => ret);
	};

	static ofRight<T>(val: T): Either<T> {
		return new Right<T>(val);
	}

	static ofLeft<T>(msg: string): Either<T> {
		return new Left(msg);
	}

	static ofNullable<T>(val: T | undefined, msg: () => string): Either<T> {
		return R.isNil(val) ? new Left<T>(msg()) : new Right<T>(val);
	}

	static ofCondition<T>(cnd: () => boolean, left: () => string, right: () => T): Either<T> {
		return cnd() ? new Right<T>(right()) : new Left<T>(left());
	}

	static ofTruth<T>(truth: Either<any>[], right: () => T): Either<T> {
		const left = truth.filter(e => e.isLeft());
		return left.length === 0 ? new Right<T>(right()) : new Left(left.map(l => l.message()).join(','));
	}

	get(): T {
		return this.val;
	}

	message(): string {
		return this.msg;
	}

	abstract mapGet<V>(left: (msg: string) => V, right: (v: T) => V): V;

	abstract orElse(other: T): T;

	abstract orElseGet(fn: () => T): T;

	abstract isLeft(): boolean;

	abstract isRight(): boolean;

	abstract map(fn: (val: T) => any): Either<any>;

	abstract remap<V>(mf: (val: T) => Either<V>, jf: (v: V, t: T) => void): Either<V>;

	abstract append<V>(producer: (val: T) => Either<V>, appender: (t: T, v: V) => void): Either<T>;

	abstract exec(fn: (v: T) => void): Either<T>;

	abstract assert(fn: (v: T) => Either<string>): Either<T>;
}

export class Left<T> extends Either<T> {

	constructor(msg: string) {
		super(null as any, msg);
	}

	mapGet<V>(left: (msg: string) => V, right: (v: T) => V): V {
		return left(this.msg);
	}

	assert(fn: (v: T) => Either<string>): Either<T> {
		return this;
	}

	map(fn: (val: T) => any): Either<any> {
		return this;
	}

	remap<V>(mf: (val: T) => Either<V>, jf: (v: V, t: T) => void): Either<V> {
		return this as unknown as Either<V>;
	}

	exec(fn: (v: T) => void): Either<T> {
		return this;
	}

	isLeft(): boolean {
		return true;
	}

	append<V>(producer: (v: T) => Either<V>, appender: (t: T, v: V) => void): Either<T> {
		return this;
	}

	isRight(): boolean {
		return false;
	}

	orElse(other: T): T {
		return other;
	}

	orElseGet(fn: () => T): T {
		return fn();
	}

	get(): T {
		throw new TypeError('Left has no value: ' + this.message());
	}

	toString(): string {
		return `Left[${this.message()}]`;
	}
}

export class Right<T> extends Either<T> {

	constructor(value: T) {
		super(value, 'Right');
		if (R.isNil(value)) {
			Log.error('Right#', 'null provided to Right');
		}
	}

	assert(fn: (v: T) => Either<string>): Either<T> {
		const resp = fn(this.val);
		if (resp.isLeft()) {
			Log.error('Right#assert', resp.message());
			return Either.ofLeft(resp.message());
		}
		return this;
	}

	orElseGet(fn: () => T): T {
		return this.val;
	}

	exec(fn: (v: T) => void): Either<T> {
		fn(this.get());
		return this;
	}

	append<V>(producer: (v: T) => Either<V>, appender: (t: T, v: V) => void): Either<T> {
		const val = this.get();
		const res = producer(val);
		if (R.isNil(res) || res.isLeft()) {
			return Either.ofLeft('append got null for ' + val);
		}
		appender(val, res.get());
		return new Right(val);
	}

	map(fn: (v: T) => any): Either<any> {
		const val = this.get();
		const res = fn(val);
		return R.isNil(res) ? Either.ofLeft('map got null for ' + val) : res instanceof Either ? res : new Right(res);
	}

	remap<V>(mf: (val: T) => Either<V>, jf: (v: V, t: T) => void): Either<V> {
		const val = this.get();
		const res = mf(val);
		if (R.isNil(res) || res.isLeft()) {
			return Either.ofLeft('remap got null for ' + val);
		}
		jf(res.get(), val);
		return res;
	}

	isLeft(): boolean {
		return false;
	}

	isRight(): boolean {
		return true;
	}

	orElse(other: T): T {
		return R.isNil(this.val) ? other : this.val;
	}

	toString(): string {
		return `Right[${this.get()}]`;
	}

	mapGet<V>(left: (msg: string) => V, right: (v: T) => V): V {
		return right(this.val);
	}
}
