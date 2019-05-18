import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';

declare var $:any;

@Component({
  selector: 'app-error-404',
  templateUrl: './error-404.component.html',
})
export class Error404Component implements OnInit, AfterViewInit, OnDestroy {

  constructor() { }

  ngOnInit() {
    $('body').addClass('empty-layout');
  }

  ngAfterViewInit() { }

  ngOnDestroy() {
    $('body').removeClass('empty-layout');
  }

}
