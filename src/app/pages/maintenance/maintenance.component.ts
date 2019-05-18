import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';

declare var $:any;

@Component({
  selector: 'app-maintenance',
  templateUrl: './maintenance.component.html',
})
export class MaintenanceComponent implements OnInit, AfterViewInit, OnDestroy {

  constructor() { }

  ngOnInit() {
    $('body').addClass('empty-layout');
  }

  ngAfterViewInit() { }

  ngOnDestroy() {
    $('body').removeClass('empty-layout');
  }

}
