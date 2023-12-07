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
import {Directories, Directory, Header, WadType} from './wad-model'
import * as R from 'ramda'
import U from '../../common/util'
import {Log} from '../../common/log'
import {Either} from '../../common/either'

const CMP = 'directory_parser'
const parseAllDirectories = (header: Header, bytes: number[]): Either<Directory[]> => {
	const dirs = R.unfold(idx => idx > header.numlumps ? false : [header.infotableofs + idx * 16, idx + 1], 0)
		.map((ofs, index) => parseDirectory(ofs, index, bytes))
	Log.debug(CMP, 'Parsed', dirs.length, 'directories')
	return Either.ofCondition(() => findDirectoryByName(dirs)(Directories.TITLEPIC).isRight(), () => Directories.TITLEPIC + ' not found in Dirs', () => dirs)
}

const parseDirectory = (offset: number, idx: number, bytes: number[]): Directory => {
	const intParser = U.parseInt32(bytes)
	return {
		filepos: intParser(offset),
		size: intParser(offset + 0x04),
		name: U.parseStr(bytes)(offset + 0x08, 8),
		idx
	}
}

const findDirectoryByName = (dirs: Directory[]) => (name: string): Either<Directory> =>
	Either.ofNullable(dirs.find(d => U.cs(d.name, name)), () => 'Directory: ' + name + ' not found')

const findDirectoryByOffset = (dirs: Directory[]) => (name: string, offset: number): Either<Directory> =>
	U.findFrom(dirs)(offset, (d, i) => d.name === name)

const parseHeader = (bytes: number[]): Either<Header> => {
	const headerStr: Either<string> = U.parseStrOp(bytes)(s => s === 'IWAD', (s) => 'Missing: ' + s + ' header')(0x00, 4)
	const intParser = U.parseInt32(bytes)
	return Either.ofTruth([headerStr], () =>
		({
			identification: headerStr.map((s: string) => WadType[s]).get(),
			numlumps: intParser(0x04),
			infotableofs: intParser(0x08)
		})).exec(h => Log.debug(CMP, 'Parsed Header:', h))
}

const findBetween = (dirs: Directory[]) => (from: string, to: string) => (filter: (dir: Directory) => boolean): Either<Directory[]> => {
	const finder = findDirectoryByName(dirs)
	const fromDir = finder(from)
	const toDir = finder(to)
	return Either.ofTruth([fromDir, toDir],
		() => dirs.slice(fromDir.get().idx, toDir.get().idx).filter(d => filter(d)))
		.map(dirs => Either.ofCondition(() => dirs.length > 0,
			() => 'No dirs between:' + from + '->' + to, () => dirs))
}

// ############################ EXPORTS ############################
export const functions = {
	parseHeader,
	parseDirectory,
	parseAllDirectories,
	findDirectoryByName,
	findDirectoryByOffset,
	findBetween
}
