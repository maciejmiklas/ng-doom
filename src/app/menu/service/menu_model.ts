export type MenuRoot = {
	l1: MenuL1[]
};

export type MenuL1 = {
	id: string,
	title: string,
	l2: MenuL2[]
};

export type MenuL2 = {
	id: string,
	title: string,
	page: string
};
