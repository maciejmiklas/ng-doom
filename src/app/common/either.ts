import * as R from 'ramda'
import {Log} from './log'

export enum LeftType {
	OK, WARN, ERROR
}

export abstract class Either<T> {

	protected readonly val: T
	protected readonly msg: () => string

	protected constructor(value: T, msg: () => string) {
		this.val = value
		this.msg = msg
	}

	static until = <T>(next: (previous: T) => Either<T>, init: Either<T>, msg: () => string = () => 'Empty result for ' + init, max = 500): Either<T[]> => {
		let val = init
		const all: T[] = []
		let cnt = 0
		while (val.isRight()) {
			if (cnt > max) {
				break
			}
			val.exec((v) => all.push(v))
			val = next(val.get())
			cnt = cnt + 1
		}
		return Either.ofCondition(() => all.length > 0, msg, () => all)
	}

	static ofArray = <T>(array: T[], msg: () => string): Either<T[]> => {
		return Either.ofCondition(() => !R.isNil(array) && !R.isEmpty(array), msg, () => array)
	}

	static ofEitherArray = <T>(...args: Either<T>[]): Either<T[]> => {
		const ret = args.filter(e => e.isRight()).map(e => e.get())
		return Either.ofCondition(() => ret.length > 0, () => 'All candidates for Array are Left: ' + args, () => ret)
	}

	static ofRight<T>(val: T): Either<T> {
		return new Right<T>(val)
	}

	static ofLeft<T>(msg: () => string, type = LeftType.OK): Either<T> {
		return new Left(msg, type)
	}

	static ofNullable<T>(val: T | undefined, msg: () => string, type = LeftType.OK): Either<T> {
		return R.isNil(val) ? Either.ofLeft(msg, type) : Either.ofRight(val)
	}

	static ofConditionFlat<T>(cnd: () => boolean, left: () => string, right: () => Either<T>, type = LeftType.OK): Either<T> {
		return cnd() ? right() : Either.ofLeft(left, type)
	}

	static ofCondition<T>(cnd: () => boolean, left: () => string, right: () => T, type = LeftType.OK): Either<T> {
		return cnd() ? Either.ofRight(right()) : Either.ofLeft(left, type)
	}

	static ofConditionC<IN, OUT>(cnd: (inp: IN) => boolean, left: (inp: IN) => () => string, right: (inp: IN) => OUT, type = LeftType.OK): (inp: IN) => Either<OUT> {
		return (inp: IN) => {
			return cnd(inp) ? Either.ofRight(right(inp)) : Either.ofLeft(left(inp), type)
		}
	}

	static ofFunction<IN, OUT>(fn: (inp: IN) => OUT, cnd: (tt: OUT) => boolean, left: (tt: OUT) => () => string, type = LeftType.OK): (inp: IN) => Either<OUT> {
		return (inp: IN) => {
			const tt = fn(inp)
			return cnd(tt) ? Either.ofRight(tt) : Either.ofLeft(left(tt), type)
		}
	}

	// TODO truth should be a function
	static ofTruth<T>(truth: Either<any>[], right: () => T, type = LeftType.OK): Either<T> {
		const left = truth.filter(e => e.isLeft())
		return left.length === 0 ? Either.ofRight(right()) : Either.ofLeft(() => left.map(l => l.message()).join(','), type)
	}

	static ofTruthFlat<T>(truth: Either<any>[], func: () => Either<T>, type = LeftType.OK): Either<T> {
		const truthLeft = truth.filter(e => e.isLeft())
		return truthLeft.length === 0 ? func() : Either.ofLeft(() => truthLeft.map(l => l.message()).join(','), type)
	}

	static ofBoolean(val: boolean, type = LeftType.OK): Either<boolean> {
		return val ? Either.ofRight(val) : Either.ofLeft(() => 'FALSE', type)
	}

	get(): T {
		return this.val
	}

	message(): string {
		return this.msg()
	}

	abstract mapGet<VL, VR>(left: (msg: () => string) => VL, right: (v: T) => VR): VL | VR

	abstract orElse(fn: () => T): T

	abstract onLeft(fn: () => void): void

	abstract orAnother(fn: () => Either<T>): Either<T>

	abstract isLeft(): boolean

	abstract isRight(): boolean

	abstract filter(): boolean

	abstract map(fn: (val: T) => any): Either<any>

	abstract remap<V>(mf: (val: T) => Either<V>, jf: (v: V, t: T) => void): Either<V>

	abstract append<V>(producer: (val: T) => Either<V>, appender: (t: T, v: V) => void): Either<T>

	abstract exec(fn: (v: T) => void): Either<T>

	abstract assert(cnd: (v: T) => boolean, left: (v: T) => () => string): Either<T>
	abstract assert(cnd: (v: T) => boolean, left: (v: T) => () => string, type: LeftType): Either<T>
}

export class Left<T> extends Either<T> {
	static CMP = 'LEFT'

	constructor(msg: () => string, type = LeftType.OK) {
		super(null as any, msg)
		if (type === LeftType.WARN && Log.isWarn()) {
			Log.warn(Left.CMP, msg())

		} else if (type === LeftType.ERROR && Log.isError()) {
			Log.error(Left.CMP, msg())

		} else if (Log.isTrace()) {
			Log.trace(Left.CMP, 'Left created: ', msg())
		}
	}

	mapGet<VL, VR>(left: (msg: () => string) => VL, right: (v: T) => VR): VL | VR {
		return left(this.msg)
	}

	assert(cnd: (v: T) => boolean, left: (v: T) => () => string, type = LeftType.OK): Either<T> {
		return this
	}

	map(fn: (val: T) => any): Either<any> {
		return this
	}

	remap<V>(mf: (val: T) => Either<V>, jf: (v: V, t: T) => void): Either<V> {
		return this as unknown as Either<V>
	}

	exec(fn: (v: T) => void): Either<T> {
		return this
	}

	isLeft(): boolean {
		return true
	}

	append<V>(producer: (v: T) => Either<V>, appender: (t: T, v: V) => void): Either<T> {
		return this
	}

	isRight(): boolean {
		return false
	}

	filter(): boolean {
		if (Log.isDebug()) {
			Log.debug(Left.CMP, 'Filter false: ', this.message())
		}
		return false
	}

	orElse(fn: () => T): T {
		return fn()
	}

	onLeft(fn: () => void): void {
		fn()
	}

	orAnother(fn: () => Either<T>): Either<T> {
		return fn()
	}

	get(): T {
		throw new TypeError('Left has no value: ' + this.message())
	}

	toString(): string {
		return `Left[${this.message()}]`
	}
}

export class Right<T> extends Either<T> {
	static CMP = 'RIGHT'

	constructor(value: T) {
		super(value, () => Right.CMP)
	}

	assert(cnd: (v: T) => boolean, left: (v: T) => () => string, type = LeftType.OK): Either<T> {
		if (!cnd(this.get())) {
			const msg = left(this.get())
			if (Log.isWarn() && type == LeftType.WARN) {
				Log.warn(Right.CMP, 'Assert:', msg())

			} else if (Log.isError() && type == LeftType.ERROR) {
				Log.error(Right.CMP, 'Assert:', msg())
			}
			return Either.ofLeft(msg)
		}
		return this
	}

	orElse(fn: () => T): T {
		return this.val
	}

	onLeft(fn: () => void): void {
	}

	orAnother(fn: () => Either<T>): Either<T> {
		return this
	}

	exec(fn: (v: T) => void): Either<T> {
		fn(this.get())
		return this
	}

	append<V>(producer: (v: T) => Either<V>, appender: (t: T, v: V) => void): Either<T> {
		const val = this.get()
		const res = producer(val)
		if (R.isNil(res) || res.isLeft()) {
			return Either.ofLeft(() => 'append got null for ' + val)
		}
		appender(val, res.get())
		return new Right(val)
	}

	map(fn: (v: T) => any): Either<any> {
		const val = this.get()
		const res = fn(val)
		return R.isNil(res) ? Either.ofLeft(() => 'map got null for ' + val) : res instanceof Either ? res : new Right(res)
	}

	remap<V>(mf: (val: T) => Either<V>, jf: (v: V, t: T) => void): Either<V> {
		const val = this.get()
		const res = mf(val)
		if (R.isNil(res) || res.isLeft()) {
			return Either.ofLeft(() => 'remap got null for ' + val)
		}
		jf(res.get(), val)
		return res
	}

	isLeft(): boolean {
		return false
	}

	isRight(): boolean {
		return true
	}

	filter(): boolean {
		return true
	}

	toString(): string {
		return `Right[${this.get()}]`
	}

	mapGet<VL, VR>(left: (msg: () => string) => VL, right: (v: T) => VR): VL | VR {
		return right(this.val)
	}
}
