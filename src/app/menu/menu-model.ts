/*
 * Copyright 2022 Maciej Miklas
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

