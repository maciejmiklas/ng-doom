/*
 * Copyright 2022 Maciej Miklas (MIT License)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

export enum LogLevel {
	OFF, ERROR, WARN, INFO, DEBUG, TRACE
}

export class Log {
	static LOG_LEVEL = LogLevel.INFO // TODO move to config!

	static error(cmp: string, ...args: any[]): void {
		if (Log.isError()) {
			console.log('ERROR(' + cmp + '): ', msg(args))
		}
	}

	static warn(cmp: string, ...args: any[]): void {
		if (Log.isWarn()) {
			console.log('WARN(' + cmp + '): ', msg(args))
		}
	}

	static info(cmp: string, ...args: any[]): void {
		if (Log.isInfo()) {
			console.log('INFO(' + cmp + '): ', msg(args))
		}
	}

	static debug(cmp: string, ...args: any[]): void {
		if (Log.isDebug()) {
			console.log('DEBUG(' + cmp + '): ', msg(args))
		}
	}

	static trace(cmp: string, ...args: any[]): void {
		if (Log.isTrace()) {
			console.log('TRACE(' + cmp + '): ', msg(args))
		}
	}

	static isTrace = (): boolean => Log.LOG_LEVEL >= LogLevel.TRACE
	static isDebug = (): boolean => Log.LOG_LEVEL >= LogLevel.DEBUG
	static isInfo = (): boolean => Log.LOG_LEVEL >= LogLevel.INFO
	static isWarn = (): boolean => Log.LOG_LEVEL >= LogLevel.WARN
	static isError = (): boolean => Log.LOG_LEVEL >= LogLevel.ERROR
}

const msg = (args: any[]): string =>
	args.reduce((prev, cur) => {
		let js = JSON.stringify(cur).replaceAll('\\"', '"')
		if (js.startsWith('"')) {
			js = js.substring(1, js.length - 1)
		}
		return prev + js
	}, '')

