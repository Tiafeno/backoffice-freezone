import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import * as _ from 'lodash';
import {ApiWordpressService} from '../../_services/api-wordpress.service';
import {Helpers} from '../../helpers';

declare var $: any;

@Component({
  selector: 'app-type-client-switcher',
  templateUrl: './type-client-switcher.component.html',
  styleUrls: ['./type-client-switcher.component.css']
})
export class TypeClientSwitcherComponent implements OnInit {
  public Form: FormGroup;
  public Client: any = null;
  private Wordpress: any;

  @Output() refresh = new EventEmitter();

  constructor(
    private apiWP: ApiWordpressService
  ) {
    this.Form = new FormGroup({
      type: new FormControl('', Validators.required)
    });
    this.Wordpress = this.apiWP.getWPAPI();
  }

  ngOnInit() {
  }

  fnOpen(client: any) {
    if (_.isObject(client)) {
      this.Client = _.clone(client);
      const roleOffice: any = parseInt(client.role_office, 10);
      this.Form.patchValue({type: _.isNaN(roleOffice) ? 0 : roleOffice });
      $('#switch-type-modal').modal('show');
    }
  }

  fnOnSave() {
    if (this.Form.valid) {
      Helpers.setLoading(true);
      const Value: any = this.Form.value;
      this.Wordpress.users().id(this.Client.id).update({
        role_office: parseInt(Value.type, 10)
      }).then(resp => {
        Helpers.setLoading(false);
        $('#switch-type-modal').modal('hide');
        this.refresh.emit();
      });
    }
  }

}
