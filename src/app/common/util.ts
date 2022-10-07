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
import * as R from 'ramda';
import {Either} from './either';
import {Log} from "./log";

const CMP = "util";

const parseUint8 = (bytes: number[]) => (pos: number, max = 255): number => ensureRange(pos, bytes[pos] >>> 0, 0, max);

/** little-endian 2-byte without sign. Notation: little-endian (two's complement) */
const parseUint16 = (bytes: number[]) => (pos: number, max = 65535): number => {
	return ensureRange(pos, parseNumber([bytes[pos], bytes[pos + 1], 0x00, 0x00])(0), 0, max);
};

/** little-endian 2-byte signed short. Notation: little-endian (two's complement) */
const parseInt16 = (bytes: number[]) => (pos: number, min = -32767, max = 32767): number => {
	const padding = signedByte(bytes[pos + 1]) ? 0xFF : 0x00;
	return ensureRange(pos, parseNumber([bytes[pos], bytes[pos + 1], padding, padding])(0), min, max);
};

const parseInt16Op = (bytes: number[]) => (cnd: (val: number) => boolean, emsg: (val: number) => string) => (pos: number): Either<number> => {
	const parsed = parseInt16(bytes)(pos);
	return Either.ofCondition(() => cnd(parsed), () => emsg(parsed), () => parsed);
};

/** little-endian 4-byte int without sign. Notation: little-endian (two's complement) */
const parseUint32 = (bytes: number[]) => (pos: number, max = 4294967295): number => ensureRange(pos, parseNumber(bytes)(pos) >>> 0, 0, max);

/** little-endian 4-byte signed int. Notation: little-endian (two's complement) */
const parseInt32 = (bytes: number[]) => (pos: number, min = -2147483647, max = 2147483647): number => ensureRange(pos, parseNumber(bytes)(pos), min, max);

const parseStr = (bytes: number[]) => (pos: number, length: number): string =>
	String.fromCharCode.apply(null, bytes.slice(pos, trim0Padding(bytes, pos + length - 1)));

const parseStrOp = (bytes: number[]) => (cnd: (val: string) => boolean, emsg: (val: string) => string) => (pos: number, length: number): Either<string> => {
	const str = parseStr(bytes)(pos, length);
	return Either.ofCondition(() => cnd(str), () => emsg(str), () => str);
};

const parseTextureName = (bytes: number[]) => (pos: number, length: number): Either<string> => {
	return parseStrOp(bytes)(v => v !== '-', () => '')(pos, length);
};

const base64ToUint8Array = (base64: string): Uint8Array => {
	const binary = window.atob(base64);
	return (new Uint8Array(binary.length)).map((v, idx) => binary.charCodeAt(idx));
};


const base64ToUint8NumberArray = (base64: string): number[] => {
	return [].slice.call(base64ToUint8Array(base64));
};

const trim0Padding = (bytes: number[], pos: number) =>
	R.until((v: number) => bytes[v] !== 0, (v: number) => v - 1)(pos) + 1;

/** Converts given signed 4-byte array to number. Notation: little-endian (two's complement) */
const parseNumber = (bytes: number[]) => (pos: number): number => {
	// @ts-ignore
	return R.pipe<number[], number[], number[], number>(
		// @ts-ignore
		R.slice(pos, pos + 4),
		R.reverse,
		R.curry(R.reduce)((acc: number, cur: number) => acc as number << 8 | cur as number, 0)
		// @ts-ignore
	)(bytes);
}

const ensureRange = (pos: number, val: number, min: number, max: number): number => {
	if (val < min || val > max) {
		Log.warn(CMP, 'Number out of range at:', pos, ' -> ', min, val, max);
		return 0;
	}
	return val
};

const signedByte = (byte: number) => (byte & 0x80) === 0x80;

/** iterate #from to #to increasing by one*/
const itn = (from: number, to: number, func: (idx: number) => void): void => {
	its(from, to, idx => ++idx, func);
};

/** iterate #from to #to increasing given by #step */
const its = (from: number, to: number, step: (idx: number) => number, func: (idx: number) => void): void => {
	for (let idx = from; idx < to; idx = step(idx)) {
		func(idx);
	}
};

const findFrom = <T>(arr: T[]) => (offset: number, pred: (T, idx: number) => boolean): Either<T> => {
	for (let idx = offset; idx < arr.length; idx++) {
		const val = arr[idx];
		if (pred(val, idx)) {
			return Either.ofRight(val);
		}
	}
	return Either.ofLeft('Element not found from ' + offset);
};

const nullSafeArray = <T>(arr: T[]): T[] => arr ? arr : [];

const nextRoll = <V>(list: V[]) => (idx: number): V =>
	R.cond([
		[(v) => v === list.length, () => list[0]], // we are after last element in list -> return first one
		[(v) => v < 0, () => list[list.length - 1]], // we are before first element in list -> return last one
		[R.T, (v) => list[v]] // we are on existing list position -> return current at #idx
	])(idx)

const U = {
	base64ToUint8NumberArray,
	trim0Padding,
	parseStr,
	parseStrOp,
	parseInt32,
	parseInt16,
	parseInt16Op,
	parseUint32,
	parseUint8,
	parseUint16,
	itn,
	its,
	findFrom,
	parseTextureName,
	nullSafeArray,
	nextRoll
};

export default U;

