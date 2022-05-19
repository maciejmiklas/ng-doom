import {Directories, Directory, TextureDir, TitlePic, Wad} from './wad-model';
import {Either} from '@maciejmiklas/functional-ts';
import {functions as dp} from './directory-parser';
import {functions as bp} from './bitmap-parser';
import {functions as mp} from './map-parser';
import {functions as tp} from './texture-parser';

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

// TODO all wrapped methods: Either.ofRight should return Either
const parseWad = (bytes: number[]): Either<Wad> =>
	dp.parseHeader(bytes)
		.map(header => ({header, bytes}))// header + bytes
		.append(w => dp.parseAllDirectories(w.header, bytes), (w, v) => w.dirs = v) // dirs
		.append(w => Either.ofRight(tp.parsePnames(bytes, w.dirs)), (w, v) => w.pnames = v) // pnames
		.append(w => Either.ofRight(bp.parsePlaypal(bytes, w.dirs)), (w, v) => w.playpal = v) // playpal
		.append(w => parseTitlePic(bytes, w.dirs), (w, v) => w.title = v)// title
		.append(w => Either.ofRight(tp.parsePatches(bytes, w.dirs)), (w, v) => w.patches = v)// patches
		.append(w => tp.parseTextures(bytes, w.dirs, w.pnames, w.patches)(TextureDir.TEXTURE1), (w, v) => w.textures = v) // textures
		.append(w => mp.parseMaps(bytes, w.dirs, w.textures), (w, v) => w.maps = v); // maps

// ############################ EXPORTS ############################
export const testFunctions = {
	parseTitlePic
};

export const functions = {
	parseWad
};
