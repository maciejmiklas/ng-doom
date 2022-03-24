export class Log {

	static error(cmp: string, msg: string, ...args: any[]): void {
		console.log('ERROR(' + cmp + '): ' + msg + ' - ', args);
	}

	static warn(cmp: string, msg: string, ...args: any[]): void {
		console.log('ERROR(' + cmp + '): ' + msg + ' - ', args);
	}

	static info(cmp: string, msg: string, ...args: any[]): void {
		// console.log('INFO(' + cmp + '): ' + msg + ' - ', args);
	}

	static debug(cmp: string, msg: string, ...args: any[]): void {
		// console.log('DEBUG(' + cmp + '): ' + msg + ' - ', args);
	}

	static trace(cmp: string, msg: string, ...args: any[]): void {
		// console.log('TRACE(' + cmp + '): ' + msg + ' - ', args);
	}
}
