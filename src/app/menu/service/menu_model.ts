export type MenuRoot = {
	l1: MenuL1[]
};

export type MenuL1 = {
	title: string,
	l2: MenuL2[]
};

export type MenuL2 = {
	title: string,
	path: string
};
