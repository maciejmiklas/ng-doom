export type MenuRoot = {
	l1: MenuL1[]
	welcomeMid: string
};

export type MenuL1 = {
	title: string,
	l2: MenuL2[]
};

export type MenuL2 = {
	id: string,
	title: string,
	path: string
	decorator: string;
};

export interface MenuDecorator {
	visible(): boolean;
}
