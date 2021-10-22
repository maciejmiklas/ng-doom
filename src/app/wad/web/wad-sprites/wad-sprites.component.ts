import {Component, OnInit} from '@angular/core';
import {WadStorageService} from '../../service/wad-storage.service';
import {functions as sp} from '../../parser/sprite_parser';
import {FrameDir, PatchBitmap, Sprite} from '../../parser/wad_model';
import {Either} from '@maciejmiklas/functional-ts';

@Component({
	selector: 'app-wad-sprite',
	templateUrl: './wad-sprites.component.html',
	styleUrls: ['./wad-sprites.component.scss']
})
export class WadSpritesComponent implements OnInit {

	sprites: BitmapSprite[][];
	scale: number[];

	constructor(private wadStorage: WadStorageService) {
	}

	ngOnInit(): void {
		const wad = this.wadStorage.getCurrent().get().wad;
		this.sprites = sp.parseSpritesAsArray(wad.bytes, wad.dirs).map(mapSprite).filter(s => s.isRight()).map(s => s.get());
		this.scale = this.sprites.map(s => s[0]).map(calcScale);
	}
}

// box has 200px, it's being set in .app-sprite
const ZOOM_MAX_SIZE = 150;

const calcScale = (sprite: BitmapSprite): number => {
	const maxWidth = sprite.frames.map(s => s.header.width).reduce((prev, cur) => prev > cur ? prev : cur);
	const maxHeight = sprite.frames.map(s => s.header.height).reduce((prev, cur) => prev > cur ? prev : cur);
	let scale = ZOOM_MAX_SIZE / Math.max(maxWidth, maxHeight);
	return scale - scale % 1;
};

const mapSprite = (sprite: Sprite): Either<BitmapSprite[]> => {
	const sprites = Object.keys(sprite.animations).map(angle => sprite.animations[angle]).map((d: FrameDir[]) => mapFrameDirs(d))
		.filter(md => md.isRight()).map(md => md.get());
	return Either.ofCondition(() => sprites.length > 0, () => sprite.name + ' has no sprites', () => sprites);
};

const mapFrameDirs = (frame: FrameDir[]): Either<BitmapSprite> => {
	const frames: PatchBitmap[] = frame.filter(f => f.bitmap.isRight()).map(f => f.bitmap.get());
	const first = frame[0];
	return Either.ofCondition(() => frames.length > 0, () => first.spriteName + ' has no frames', () => ({
		name: first.spriteName,
		angle: first.angle.toString(),
		frames
	}));
};

export type BitmapSprite = {
	name: string,
	angle: string,
	frames: PatchBitmap[]
}
