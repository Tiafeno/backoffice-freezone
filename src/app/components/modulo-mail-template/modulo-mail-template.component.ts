import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import * as _ from 'lodash';
import { ApiWordpressService } from '../../_services/api-wordpress.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Helpers } from '../../helpers';
import Swal from 'sweetalert2';
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
  public viewForm: boolean = false;
  @Output() set_predefined: EventEmitter<any> = new EventEmitter<{subject: string, message: string}>();
  constructor(
    private apiWP: ApiWordpressService,
    private cd: ChangeDetectorRef
  ) {
    this.Wordpress = this.apiWP.getWordpress();
    this.Form = new FormGroup({
      subject: new FormControl('', Validators.required),
      message: new FormControl('', Validators.required)
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
    console.log(predefined);
    if (_.isUndefined(predefined)) return false;
    this.set_predefined.emit({subject: predefined.title.rendered, message: predefined.content.rendered});
  }

  onRemoveTmpl(_id: number) {
    Helpers.setLoading(true);
    this.Wordpress.mail_template().id(_id).delete().then(resp => {
      Helpers.setLoading(false);
      this.predefined = _.reject(this.predefined, {id: _id} as any);
      this.cd.detectChanges();
    });
  }

  onSavePredefined() {
    if (this.Form.valid) {
      const value: any = this.Form.value;
      Helpers.setLoading(true);
      this.Wordpress.mail_template().create({
        status: 'publish',
        title: value.subject,
        content: value.message
      }).then(resp => {
        Helpers.setLoading(false);
        this.predefined.push(resp);
        this.viewForm = false;
        this.Form.reset();
        this.cd.detectChanges();
      })
      .catch(err => {
        Helpers.setLoading(false);
        Swal.fire('Désolé', err, 'error');
      })
    } else {
      Swal.fire('Validation', "Les champs sujet et message sont requis. Merci de bien vérifier", 'warning');
    }
  }

  onAddTemplateMail() {
    this.viewForm = true;
  }

  onAbordTemplateMail() {
    this.viewForm = false;
    this.Form.reset();
  }

}
