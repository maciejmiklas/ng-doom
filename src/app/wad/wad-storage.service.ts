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

import {Injectable} from '@angular/core'
import {UploadResult, UploadStatus} from './wad-upload/wad-upload-model'
import {Wad, WadEntry} from './parser/wad-model'
import {Either} from '../common/either'
import {functions as wp} from './parser/wad-parser'
import {Log} from '../common/log'
import {BehaviorSubject, distinctUntilChanged, Observable, shareReplay, tap} from "rxjs";

const CMP = "WadStorageService"

@Injectable({
  providedIn: 'root'
})
export class WadStorageService {
  static CMP = 'WadStorageService'
  private wads: WadEntry[] = []
  private currentWad = 0
  private readonly loadedSubject$ = new BehaviorSubject<boolean>(false);
  readonly loaded$: Observable<boolean> = this.loadedSubject$.asObservable()
    .pipe(
      tap(v => console.log('loaded$:', v)),
      distinctUntilChanged(), // only emit when the value changes
      shareReplay({bufferSize: 1, refCount: true}) // share the last emitted value to new subscribers
    );

  public async uploadWad(file: File): Promise<UploadResult> {
    return this.uploadWadIntern(file).then(res => {
      this.markLoaded();
      return res
    })
  }

  private markLoaded() {
    this.loadedSubject$.next(true);
  }

  private markUnloaded() {
    this.loadedSubject$.next(false);
  }

  private async uploadWadIntern(file: File): Promise<UploadResult> {
    if (!file.name.toLocaleLowerCase().endsWith('.wad')) {
      return {fileName: file.name, status: UploadStatus.UNSUPPORTED_TYPE, message: undefined}
    }
    if (this.wads.some(w => w.name === file.name)) {
      return {fileName: file.name, status: UploadStatus.FILE_ALREADY_EXISTS, message: undefined}
    }
    return file.arrayBuffer().then(ab => {
      return this.load(ab).mapGet<UploadResult, UploadResult>(message => {
          return {fileName: file.name, status: UploadStatus.PARSE_ERROR, message: message()}
        },
        wad => {
          this.wads.push({wad, name: file.name, gameSave: []})
          this.currentWad = this.wads.length - 1
          return {fileName: file.name, status: UploadStatus.UPLOADED, message: undefined}
        })
    })
  }

  public isLoaded(): boolean {
    return this.loadedSubject$.value;
  }

  public removeAllWads(): void {
    this.wads = []
    this.currentWad = 0
    this.markUnloaded();
  }

  public setCurrentWad(idx: number): boolean {
    if (idx >= this.wads.length) {
      Log.warn(WadStorageService.CMP, 'Cannot set current wad to: %1 > %2', idx, this.wads.length)
      return false
    }
    this.currentWad = idx
    return true
  }

  public getCurrent(): Either<WadEntry> {
    return Either.ofCondition(() => this.isLoaded(), () => 'No WADs', () => this.wads[this.currentWad])
  }

  private load(wadBuf: ArrayBuffer): Either<Wad> {
    const bytes = Either.ofRight(Array.from(new Uint8Array(wadBuf))).get()
    const startTime = performance.now()
    const wad = wp.parseWad(bytes)
    Log.info(CMP, 'WAD parsed in ', performance.now() - startTime, ' ms')
    return wad
  }
}



