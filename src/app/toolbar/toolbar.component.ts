import {
  AfterViewInit,
  Component,
  computed,
  EventEmitter,
  inject, OnInit,
  Output,
  signal,
  Signal,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
  WritableSignal
} from "@angular/core";
import {MatToolbar} from "@angular/material/toolbar";
import {MatIconButton} from "@angular/material/button";
import {NgIcon, provideIcons} from '@ng-icons/core';
import {phosphorArrowCircleLeftBold, phosphorArrowCircleRightBold} from "@ng-icons/phosphor-icons/bold"
import {MatCard, MatCardContent} from "@angular/material/card";
import {ToolbarHostService} from "./toolbar-host.service";

@Component({
  selector: 'app-toolbar',
  viewProviders: [provideIcons({phosphorArrowCircleRightBold, phosphorArrowCircleLeftBold})],
  imports: [
    MatToolbar,
    MatIconButton,
    NgIcon,
    MatCard,
    MatCardContent
  ],
  templateUrl: 'toolbar.component.html',
  standalone: true,
  styleUrl: 'toolbar.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ToolbarComponent implements OnInit {

  @Output()
  private hideButtonClick: EventEmitter<boolean> = new EventEmitter<boolean>()

  @ViewChild('host', {read: ViewContainerRef, static: true})
  private host!: ViewContainerRef

  private open: WritableSignal<boolean> = signal(true)
  private hostService = inject(ToolbarHostService)

  // https://ng-icons.github.io/ng-icons/#/browse-icons
  hideIcon: Signal<string> = computed(() => this.open()
    ? 'phosphorArrowCircleLeftBold' : 'phosphorArrowCircleRightBold')

  ngOnInit() {
    this.hostService.setHost(this.host)
  }

  onHideButtonClick() {
    this.open.update(prev => !prev)
    this.hideButtonClick.emit(this.open())
  }

}


