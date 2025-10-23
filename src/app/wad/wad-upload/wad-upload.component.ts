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
import {Component, computed, inject, Signal, signal, WritableSignal} from '@angular/core'
import {FileSystemFileEntry, NgxFileDropEntry, NgxFileDropModule} from 'ngx-file-drop'
import {WadStorageService} from '../wad-storage.service'
import {UploadResult, UploadStatus} from './wad-upload-model'
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";

// https://material.angular.dev/components/table/examples
@Component({
  selector: 'app-wad-upload',
  template: `
    <div class="app-upload-container">
      <ngx-file-drop dropZoneLabel="Drop files here" (onFileDrop)="uploadFiles($event)"
                     dropZoneClassName="none" contentClassName="app-upload-content"
                     [disabled]="uploading()">
        <ng-template ngx-file-drop-content-tmp let-openFileSelector="openFileSelector">
          <div (click)="openFileSelector()" class="app-upload-click">
            <br><br><br><br><br><br>
            <strong>CLICK HERE OR DROP WAD FILE</strong>
          </div>
        </ng-template>

      </ngx-file-drop>
    </div>
    @if (uploading()) {
      <mat-spinner></mat-spinner>
    }
    @if (uploadResults().length > 0) {
      <div class="card text-center">
        <div class="card-header">
          <h2>Upload status</h2>
        </div>
        <div class="card-body">
          <table class="table table-striped">
            <thead>
            <tr>
              <th scope="col"></th>
              <th scope="col">Name</th>
              <th scope="col">Status</th>
            </tr>
            </thead>
            <tbody>
              @for (result of uploadResults(); track result.fileName) {
                <tr>
                  <td>
                    @switch (result.status) {
                      @case (UploadStatus.UPLOADED) {
                        <i class="bi bi-emoji-sunglasses"></i>
                      }
                      @case (UploadStatus.FILE_ALREADY_EXISTS) {
                        <i class="bi bi-emoji-wink"></i>
                      }
                      @case (UploadStatus.UNSUPPORTED_TYPE) {
                        <i class="bi bi-emoji-neutral"></i>
                      }
                      @case (UploadStatus.PARSE_ERROR) {
                        <i class="bi bi-emoji-frown"></i>
                      }
                      @default {
                        <i class="bi bi-emoji-dizzy"></i>
                      }
                    }
                  </td>
                  <td>{{ result.fileName }}</td>
                  <td>{{ result.status }}
                    @if (result.message !== undefined) {
                      <span>{{ result.message }}</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `,
  standalone: true,
  imports: [NgxFileDropModule, MatProgressSpinnerModule]
})
export class WadUploadComponent {
  uploadCountdown: WritableSignal<number> = signal(0)
  uploadResults: WritableSignal<UploadResult[]> = signal([])
  wadStorage: WadStorageService = inject(WadStorageService)
  uploading: Signal<boolean> = computed(() => this.uploadCountdown() > 0)

  public uploadFiles(files: NgxFileDropEntry[]): void {
    this.uploadCountdown.set(files.length)
    for (const file of files) {
      const fileEntry = file.fileEntry as FileSystemFileEntry
      fileEntry.file((file: File) => {
        this.wadStorage.uploadWad(file).then(res => {
          this.uploadResults.update(results => [...results, res])
          this.uploadCountdown.update(count => count - 1)
        })
      })
    }
  }

  protected readonly UploadStatus = UploadStatus;
}
