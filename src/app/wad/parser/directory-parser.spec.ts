/*
 * Copyright 2002-2019 the original author or authors.
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
import {Directories, Directory, MapLumpType} from './wad-model';
import {functions as dp} from './directory-parser';
import {
	E1M1_BLOCKMAP,
	E1M1_LINEDEFS,
	E1M1_THINGS,
	eqDir,
	FD_E1M1,
	FD_E1M2,
	FIRST_MAP_DIR_OFFSET,
	getAllDirs,
	getHeader,
	getWadBytes,
	validateDir
} from './testdata/data';

describe('directory_parser#findDirectoryByName', () => {
	const find = dp.findDirectoryByName(getAllDirs());
	const findAndCompare = (name: string) => {
		expect(find(name).get().name).toEqual(name);
	};

	it('Find first', () => {
		findAndCompare('PLAYPAL');
	});

	it('Find last', () => {
		findAndCompare('F_END');
	});

	it('Find map 1', () => {
		findAndCompare('E1M1');
	});

	it('Find title', () => {
		findAndCompare(Directories.TITLEPIC);
	});
});

describe('directory_parser#findDirectoryByOffset', () => {
	const find = dp.findDirectoryByOffset(getAllDirs());
	const findAndCompare = (name: string, offset: number) => {
		expect(find(name, offset).get().name).toEqual(name);
	};

	it('Find first', () => {
		findAndCompare('PLAYPAL', 0);
	});

	it('Find last', () => {
		findAndCompare('F_END', 100);
	});

	it('Find map 1', () => {
		findAndCompare('E1M1', 5);
	});

	it('Find title', () => {
		findAndCompare(Directories.TITLEPIC, 10);
	});
});


const findDirectory = (dir: Directory, dirs: Directory[]) =>
	dirs.find(d => (d.name === dir.name && d.filepos === dir.filepos && d.size === dir.size));

describe('directory_parser#parseAllDirectories', () => {
	const header = getHeader().get();
	const allDirs = dp.parseAllDirectories(header, getWadBytes()).get();
	const validate = (dir: Directory) => {
		const found = findDirectory(dir, allDirs);
		expect(found).toBeDefined('Dir:' + dir.name + ' not found');
		eqDir(dir, found);

	};
	it('First MAP', () => {
		validate(FD_E1M1);
	});

	it('Second MAP', () => {
		validate(FD_E1M2);
	});

	it('First MAP - THINGS', () => {
		validate(E1M1_THINGS);
	});

	it('First MAP - LINEDEFS', () => {
		validate(E1M1_LINEDEFS);
	});

	it('First MAP - BLOCKMAP', () => {
		validate(E1M1_BLOCKMAP);
	});
});

describe('directory_parser#parseDirectory', () => {
	const header = getHeader().get();
	const validate = validateDir(header);

	it('First MAP', () => {
		validate(FIRST_MAP_DIR_OFFSET, FD_E1M1);
	});

	it('Second MAP', () => {
		validate(FIRST_MAP_DIR_OFFSET + MapLumpType.BLOCKMAP + 1, FD_E1M2);
	});
});

describe('directory_parser#parseHeader', () => {

	it('Header found', () => {
		expect(getHeader().isRight()).toBeTruthy();
	});
	it('numlumps', () => {
		expect(getHeader().get().numlumps).toEqual(1264);
	});
});
