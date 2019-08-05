import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
declare var $: any;

@Component({
  selector: 'app-modulo-mail-template',
  templateUrl: './modulo-mail-template.component.html',
  styleUrls: ['./modulo-mail-template.component.css']
})
export class ModuloMailTemplateComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  onAddTemplateMail() {
    $('#mail-template-modal').modal('show');
  }

}
