/*
 * Copyright 2025 Maciej Miklas (MIT License)
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
import {Component, computed, inject, Signal, signal} from "@angular/core";
import {MatAccordion, MatExpansionPanel, MatExpansionPanelHeader} from "@angular/material/expansion";
import {MenuService} from "./menu.service";
import {MatListItem, MatNavList} from "@angular/material/list";
import {MenuL1, MenuL2} from "./menu-model";
import {Router} from "@angular/router";
import {Log} from "../common/log";

@Component({
  selector: 'app-menu',
  standalone: true,
  providers: [MenuService],
  imports: [
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatListItem,
    MatNavList
  ],
  templateUrl: './menu.component.html',
})
export class MenuComponent {
  private router = inject(Router)
  private readonly menuService = inject(MenuService)
  menu = this.menuService.menu()
  activeL1 = signal<string>('-')
  activeL2 = signal<string>('-')

  onL2Click(l1: MenuL1, l2: MenuL2) {
    this.activeL1.set(l1.id)
    this.activeL2.set(l2.id)
    this.router.navigate(['/', l1.path, l2.path])
      .catch(er => Log.error('Cannot navigate to ' + l2.path + ': ' + er.message + ''))
  }

  isActivated = (l1Id: string, l2Id: string): Signal<boolean> =>
    computed(() => this.activeL1() === l1Id && this.activeL2() === l2Id)
}
