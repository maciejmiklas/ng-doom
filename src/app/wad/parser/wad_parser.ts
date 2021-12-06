import {Directories, Directory, TitlePic, Wad} from './wad_model';
import {Either} from '@maciejmiklas/functional-ts';
import {functions as dp} from './directory_parser';
import {functions as bp} from './bitmap_parser';

const parseTitlePic = (bytes: number[], dirs: Directory[]): Either<TitlePic> => {
	const find = dp.findDirectoryByName(dirs);
	const title = find(Directories.TITLEPIC).map(d => bp.parseBitmap(bytes)(d));
	const credit = find(Directories.CREDIT).map(d => bp.parseBitmap(bytes)(d));
	const md = find(Directories.M_DOOM).map(d => bp.parseBitmap(bytes)(d));
	const help = Either.ofArray(find('HELP1').map(d => bp.parseBitmap(bytes)(d)), find('HELP2').map(d => bp.parseBitmap(bytes)(d)));

	return Either.ofCondition(() => title.isRight() && credit.isRight() && credit.isRight(), () => 'Image Folders not found', () => ({
		help,
		title: title.get(),
		credit: credit.get(),
		mDoom: md.get()
	}));
};

const parseWad = (bytes: number[]): Either<Wad> =>
	dp.parseHeader(bytes)
		.map(header => ({header, bytes}))
		.append(w => dp.parseAllDirectories(w.header, bytes), (t, v) => t.dirs = v)
		.append(w => parseTitlePic(bytes, w.dirs), (t, v) => t.title = v);

// ############################ EXPORTS ############################
export const testFunctions = {
	parseTitlePic
};

export const functions = {
	parseWad
};
