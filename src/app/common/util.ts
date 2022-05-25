import * as R from 'ramda';
import {Either} from '@maciejmiklas/functional-ts';

const uint8ArrayToBase64 = (bytes: number[]): string => {
	let binary = '';
	const len = bytes.length;
	for (let i = 0; i < len; i++) {// TODO not functional
		binary += String.fromCharCode(bytes[i]);
	}
	return window.btoa(binary);
};

const base64ToUint8Array = (base64: string): Uint8Array => {
	const binary = window.atob(base64);
	const len = binary.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {// TODO not functional
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
};

const base64ToArray = (base64: string): number[] => {
	return [].slice.call(base64ToUint8Array(base64));
};

const trim0Padding = (bytes: number[], pos: number) =>
	R.until((v: number) => bytes[v] !== 0, (v: number) => v - 1)(pos) + 1;

const parseStr = (bytes: number[]) => (pos: number, length: number): string =>
	String.fromCharCode.apply(null, bytes.slice(pos, trim0Padding(bytes, pos + length - 1)));

const parseStrOp = (bytes: number[]) => (cnd: (val: string) => boolean, emsg: (val: string) => string) => (pos: number, length: number): Either<string> => {
	const str = parseStr(bytes)(pos, length);
	return Either.ofCondition(() => cnd(str), () => emsg(str), () => str);
};

const parseTextureName = (bytes: number[]) => (pos: number, length: number): Either<string> => {
	return parseStrOp(bytes)(v => v !== '-', () => '')(pos, length);
};

/** Converts given signed 4-byte array to number. Notation: little-endian (two's complement) */
const parseNumber = (bytes: number[]) => (pos: number): number =>
	R.pipe<number[], number[], number[], number>(
		R.slice(pos, pos + 4),
		R.reverse,
		R.curry(R.reduce)((acc: unknown, cur: unknown) => acc as number << 8 | cur as number, 0)
	)(bytes);

/** little-endian 4-byte signed int. Notation: little-endian (two's complement) */
const parseInt = (bytes: number[]) => (pos: number): number => parseNumber(bytes)(pos);

/** little-endian 4-byte int without sign. Notation: little-endian (two's complement) */
const parseUint = (bytes: number[]) => (pos: number): number => parseNumber(bytes)(pos) >>> 0;

const parseUbyte = (bytes: number[]) => (pos: number): number => bytes[pos] >>> 0;

const signedByte = (byte: number) => (byte & 0x80) === 0x80;

/** little-endian 2-byte signed short. Notation: little-endian (two's complement) */
const parseShort = (bytes: number[]) => (pos: number): number => {
	const padding = signedByte(bytes[pos + 1]) ? 0xFF : 0x00;
	return parseNumber([bytes[pos], bytes[pos + 1], padding, padding])(0);
};

const parseShortOp = (bytes: number[]) => (cnd: (val: number) => boolean, emsg: (val: number) => string) => (pos: number): Either<number> => {
	const parsed = parseShort(bytes)(pos);
	return Either.ofCondition(() => cnd(parsed), () => emsg(parsed), () => parsed);
};

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
	return Either.ofLeft('Element not found from ' + offset + ' in ' + arr);
};

const U = {
	uint8ArrayToBase64,
	base64ToUint8Array: base64ToArray,
	trim0Padding,
	parseStr,
	parseStrOp,
	parseInt,
	parseShort,
	parseShortOp,
	parseUint,
	parseUbyte,
	itn,
	its,
	findFrom,
	parseTextureName
};

export default U;

