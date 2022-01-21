import {Directories, Directory, Header, WadType} from './wad-model';
import * as R from 'ramda';
import U from '../../common/is/util';
import {Log} from '../../common/is/log';
import {Either} from '@maciejmiklas/functional-ts';

const parseAllDirectories = (header: Header, bytes: number[]): Either<Directory[]> => {
	const dirs = R.unfold(idx => idx > header.numlumps ? false : [header.infotableofs + idx * 16, idx + 1], 0)
		.map((ofs, index) => parseDirectory(ofs, index, bytes));
	Log.debug('directory_parser#parseAllDirectories', 'Parsed %1 directories', dirs.length);
	return Either.ofCondition(() => findDirectoryByName(dirs)(Directories.TITLEPIC).isRight(), () => Directories.TITLEPIC + ' not found in Dirs', () => dirs);
};

const parseDirectory = (offset: number, idx: number, bytes: number[]): Directory => {
	const intParser = U.parseInt(bytes);
	const dir = {
		filepos: intParser(offset),
		size: intParser(offset + 0x04),
		name: U.parseStr(bytes)(offset + 0x08, 8),
		idx
	};
	Log.trace('directory_parser#parseDirectory', 'Parsed Directory %1 on %2 -> %3', idx, offset, dir);
	return dir;
};

const findDirectoryByName = (dirs: Directory[]) => (name: string): Either<Directory> =>
	Either.ofNullable(dirs.find(d => d.name === name), () => 'Directory: ' + name + ' not found');

const findDirectoryByOffset = (dirs: Directory[]) => (name: string, offset: number): Either<Directory> =>
	U.findFrom(dirs)(offset, (d, i) => d.name === name);

const parseHeader = (bytes: number[]): Either<Header> => {
	const headerStr: Either<string> = U.parseStrOp(bytes)(s => s === 'IWAD', (s) => 'Missing: ' + s + ' header')(0x00, 4);
	const intParser = U.parseInt(bytes);
	return Either.ofTruth([headerStr], () =>
		({
			identification: headerStr.map((s: string) => WadType[s]).get(),
			numlumps: intParser(0x04),
			infotableofs: intParser(0x08)
		})).exec(h => Log.debug('directory_parser#parseHeader', 'Parsed Header: %1', h));
};

// ############################ EXPORTS ############################
export const functions = {
	parseHeader,
	parseDirectory,
	parseAllDirectories,
	findDirectoryByName,
	findDirectoryByOffset
};
