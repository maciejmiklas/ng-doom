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

export enum LogLevel {
	OFF, ERROR, WARN, INFO, DEBUG, TRACE
}

export class Log {
	static LOG_LEVEL = LogLevel.INFO

	static error(cmp: string, ...args: any[]): void {
		if (Log.isError()) {
			console.log('ERROR(' + cmp + '): ', JSON.stringify(args))
		}
	}

	static warn(cmp: string, ...args: any[]): void {
		if (Log.isWarn()) {
			console.log('WARN(' + cmp + '): ', JSON.stringify(args))
		}
	}

	static info(cmp: string, ...args: any[]): void {
		if (Log.isInfo()) {
			console.log('INFO(' + cmp + '): ', JSON.stringify(args))
		}
	}

	static debug(cmp: string, ...args: any[]): void {
		if (Log.isDebug()) {
			console.log('DEBUG(' + cmp + '): ', JSON.stringify(args))
		}
	}

	static trace(cmp: string, ...args: any[]): void {
		if (Log.isTrace()) {
			console.log('TRACE(' + cmp + '): ', JSON.stringify(args))
		}
	}

	static isTrace = (): boolean => Log.LOG_LEVEL >= LogLevel.TRACE;
	static isDebug = (): boolean => Log.LOG_LEVEL >= LogLevel.DEBUG;
	static isInfo = (): boolean => Log.LOG_LEVEL >= LogLevel.INFO;
	static isWarn = (): boolean => Log.LOG_LEVEL >= LogLevel.WARN;
	static isError = (): boolean => Log.LOG_LEVEL >= LogLevel.ERROR;
}


