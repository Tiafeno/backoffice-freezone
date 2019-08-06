import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import * as _ from 'lodash';
import { ApiWordpressService } from '../../_services/api-wordpress.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import * as _ from 'lodash';
declare var $: any;

@Component({
  selector: 'app-modulo-mail-template',
  templateUrl: './modulo-mail-template.component.html',
  styleUrls: ['./modulo-mail-template.component.css']
})
export class ModuloMailTemplateComponent implements OnInit {
  private Wordpress: any;
  public predefined: Array<any>;
  public Form: FormGroup;
  @Output() set_predefined: EventEmitter<any> = new EventEmitter();
  constructor(
    private apiWP: ApiWordpressService,
    private cd: ChangeDetectorRef
  ) {
    this.Wordpress = this.apiWP.getWordpress();
    this.Form = new FormGroup({
      predefined: new FormControl(0, Validators.required)
    })
   }

  ngOnInit() {
    this.Wordpress.mail_template().then(templates => {
      this.predefined = _.isArray(templates) ? templates : [];
      this.cd.detectChanges();
    });
  }

  onSelectTmpl(_id: number): void | boolean {
    let predefined = _.find(this.predefined, {id: _id} as any);
    if (_.isUndefined(predefined)) return false;
    this.set_predefined.emit({subject: predefined.title.rendered, message: predefined.content.rendered});
  }

  onAddTemplateMail() {
    $('#mail-template-modal').modal('show');
  }

}
