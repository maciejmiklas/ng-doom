export type MenuRoot = {
	l1: MenuL1[],
	initialState: MenuState
};

export type MenuL1 = {
	title: string,
	id: string,
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

export type MenuState = {
	idL1: string,
	idL2: string;
};

