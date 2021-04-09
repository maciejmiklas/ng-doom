export class Log {

	static error(msg: string, ...args: any[]): void {
		console.log('ERROR: ' + msg + ' - ', args);
	}

	static info(msg: string, ...args: any[]): void {
		// console.log('INFO: ' + msg + ' - ', args);
	}

	static debug(msg: string, ...args: any[]): void {
		// console.log('DEBUG: ' + msg + ' - ', args);
	}

	static trace(msg: string, ...args: any[]): void {
		// console.log('TRACE: ' + msg + ' - ', args);
	}
}
