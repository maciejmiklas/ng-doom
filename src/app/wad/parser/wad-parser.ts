import {Directories, Directory, TitlePic, Wad} from './wad-model';
import {Either} from '@maciejmiklas/functional-ts';
import {functions as dp} from './directory-parser';
import {functions as bp} from './bitmap-parser';
import {functions as mp} from './map-parser';

const parseTitlePic = (bytes: number[], dirs: Directory[]): Either<TitlePic> => {
	const find = dp.findDirectoryByName(dirs);
	const title = find(Directories.TITLEPIC).map(d => bp.parseBitmap(bytes)(d));
	const credit = find(Directories.CREDIT).map(d => bp.parseBitmap(bytes)(d));
	const md = find(Directories.M_DOOM).map(d => bp.parseBitmap(bytes)(d));
	const help = Either.ofEitherArray(find('HELP1').map(d => bp.parseBitmap(bytes)(d)), find('HELP2').map(d => bp.parseBitmap(bytes)(d)));

	return Either.ofCondition(() => title.isRight() && credit.isRight() && credit.isRight(), () => 'Image Folders not found', () => ({
		help,
		title: title.get(),
		credit: credit.get(),
		mDoom: md.get()
	}));
};

// TODO append will not append if it's null resulting in nullpointer later on
const parseWad = (bytes: number[]): Either<Wad> =>
	dp.parseHeader(bytes)
		.map(header => ({header, bytes}))
		.append(w => dp.parseAllDirectories(w.header, bytes), (w, v) => w.dirs = v)
		.append(w => parseTitlePic(bytes, w.dirs), (w, v) => w.title = v)
		.append(w => mp.parseMaps(bytes, w.dirs), (w, v) => w.maps = v);

// ############################ EXPORTS ############################
export const testFunctions = {
	parseTitlePic
};

export const functions = {
	parseWad
};
