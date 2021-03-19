import * as R from 'ramda';
import {Either} from './either';

const uint8ArrayToBase64 = (bytes: number[]): string => {
	let binary = '';
	const len = bytes.length;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return window.btoa(binary);
};

const base64ToUint8Array = (base64: string): number[] => {
	const binary = window.atob(base64);
	const len = binary.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return [].slice.call(bytes);
};

const trim0Padding = (bytes: number[], pos: number) =>
	R.until((v: number) => bytes[v] !== 0, (v: number) => v - 1)(pos) + 1;

const parseStr = (bytes: number[]) => (pos: number, length: number): string =>
	String.fromCharCode.apply(null, bytes.slice(pos, trim0Padding(bytes, pos + length - 1)));

const parseStrOp = (bytes: number[]) => (cnd: (val: string) => boolean, emsg: (val: string) => string) => (pos: number, length: number): Either<string> => {
	const str = parseStr(bytes)(pos, length);
	return Either.ofCondition(() => cnd(str), () => emsg(str), () => str);
};

/** Converts given signed 4-byte array to number. Notation: little-endian (two's complement) */
const parseNumber = (bytes: number[]) => (pos: number): number =>
	R.pipe<number[], number[], number[], number>(
		R.slice(pos, pos + 4),
		R.reverse,
		// TODO replace unknown with something that compiles
		R.curry(R.reduce)((acc: unknown, cur: unknown) => acc as number << 8 | cur as number, 0)
	)(bytes);

/** little-endian 32bit signed int. Notation: little-endian (two's complement) */
const parseInt = (bytes: number[]) => (pos: number): number => parseNumber(bytes)(pos);

/** little-endian 32bit int without sign. Notation: little-endian (two's complement) */
const parseUint = (bytes: number[]) => (pos: number): number => parseNumber(bytes)(pos) >>> 0;

const parseUbyte = (bytes: number[]) => (pos: number): number => bytes[pos] >>> 0;

const signedByte = (byte: number) => (byte & 0x80) === 0x80;

/** little-endian 16bit signed short. Notation: little-endian (two's complement) */
const parseShort = (bytes: number[]) => (pos: number): number => {
	const padding = signedByte(bytes[pos + 1]) ? 0xFF : 0x00;
	return parseNumber([bytes[pos], bytes[pos + 1], padding, padding])(0);
};

const parseShortOp = (bytes: number[]) => (cnd: (val: number) => boolean, emsg: (val: number) => string) => (pos: number): Either<number> => {
	const parsed = parseShort(bytes)(pos);
	return Either.ofCondition(() => cnd(parsed), () => emsg(parsed), () => parsed);
};

const U = {
	uint8ArrayToBase64,
	base64ToUint8Array,
	trim0Padding,
	parseStr,
	parseStrOp,
	parseInt,
	parseShort,
	parseShortOp,
	parseUint,
	parseUbyte
};

export default U;

