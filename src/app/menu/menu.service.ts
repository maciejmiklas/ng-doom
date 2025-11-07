/*
 * Copyright 2022 Maciej Miklas (MIT License)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import {computed, inject, Injectable, signal, Signal} from '@angular/core'
import {MenuL1, MenuL2, MenuPath, MenuRoot, MenuVisibilityCheck} from './menu-model'
import menuJson from './menu.json'
import {toSignal} from "@angular/core/rxjs-interop";
import {Observable, of} from "rxjs";
import {MultipleWadsLoadedMenuVisibilityCheck, WadLoadedMenuVisibilityCheck} from "../wad/wad-menu.service";
import {InGameVisibilityCheck} from "../game/game-menu.service";

@Injectable()
export class MenuService {

  private readonly checks: Record<string, MenuVisibilityCheck> = {
    'wadLoaded': inject(WadLoadedMenuVisibilityCheck),
    'multipleWadsLoaded': inject(MultipleWadsLoadedMenuVisibilityCheck),
    'inGame': inject(InGameVisibilityCheck),
    'always': inject(AlwaysVisible)
  }

  menu(): Signal<MenuRoot> {
    let menu: MenuRoot = menuJson;
    menu.l1.forEach(l1 => {
      l1.l2.forEach(l2 => l2.visibilityCheck = this.isVisibleL2(l2))
      l1.visibilityCheck = this.isVisibleL1(l1)
    })
    return signal<MenuRoot>(menu)
  }

  private isVisibleL1(l1: MenuL1): Signal<boolean> {
    return computed(() => l1.l2.some(l2 => l2.visibilityCheck()))
  }

  private isVisibleL2(l2: MenuL2): Signal<boolean> {
    if (!l2.visibilityCheckName) {
      return signal(true)
    }
    let serv = this.checks[l2.visibilityCheckName]
    return toSignal(serv.visible(), {initialValue: false})
  }
}

@Injectable({providedIn: 'root'})
export class AlwaysVisible implements MenuVisibilityCheck {
  visible(): Observable<boolean> {
    return of(true);
  }
}

