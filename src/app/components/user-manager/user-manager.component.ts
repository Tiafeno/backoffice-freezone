import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ApiWordpressService } from '../../_services/api-wordpress.service';
import { Helpers } from '../../helpers';
import * as _ from 'lodash';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
declare var $: any;

@Component({
  selector: 'app-user-manager',
  templateUrl: './user-manager.component.html',
  styleUrls: ['./user-manager.component.css']
})
export class UserManagerComponent implements OnInit {
  private Wordpress: any;
  public Form: FormGroup;
  public Users: Array<any> = [];
  public type: string = 'new'; // new or edit
  public Roles: Array<any> = [
    {label: 'Commercial', value: 'editor'},
    {label: 'Techinicien', value: 'author'}
  ];
  constructor(
    private apiWP: ApiWordpressService,
    private cd: ChangeDetectorRef
  ) { 
    this.Wordpress = this.apiWP.getWordpress();
    this.Form = new FormGroup({
      last_name: new FormControl(''),
      first_name: new FormControl(''),
      role: new FormControl(null, Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      pwd: new FormControl(null),
      id: new FormControl(0) // not view in template
    });
  }

  ngOnInit() {
    Helpers.setLoading(true);
    this.Wordpress.users().param('roles', 'editor,author').context('edit').then(resp => {
      this.Users = _.clone(resp);
      this.cd.detectChanges();
      Helpers.setLoading(false);
    });
    $('#user-dialog').on('hide.bs.modal', e => {
      this.Form.reset();
      this.cd.detectChanges();
    });
  }

  public onRemove(userId: number) {
    Swal.fire({
      title: 'Confirmation',
      html: `Voulez vous vraiment supprimer l'utilisateur?`,
      type: 'warning',
      showCancelButton: true,
      showLoaderOnConfirm: true,
    }).then(result => {
      if (result.value) {
        Helpers.setLoading(true);
        this.Wordpress.users().id(userId).delete({force: true, reassign: 1}).then(resp => {
          Helpers.setLoading(false);
          this.ngOnInit();
          Swal.fire('Succès', "Utilisateur supprimer avec succès", 'success');
        }).catch(err => { 
          Helpers.setLoading(false);
          Swal.fire('Erreur', "Une erreur s'est produit", 'error');
        });
      }
    });
  }

  public onEdit(userId: number) {
    this.type = 'edit';
    const User: any = _.find(this.Users, {id: userId} as any);
    if (!_.isUndefined(User)) {
      const roles = User.roles;
      this.Form.patchValue({
        last_name: User.last_name,
        first_name: User.first_name,
        email: User.email,
        id: User.id,
        role: _.isArray(roles) && !_.isEmpty(roles) ? roles[0] : null,
        pwd: null
      });
      this.Form.get('email').disable();
      this.Form.get('pwd').setValidators(null);
      this.Form.get('pwd').updateValueAndValidity();
      $('#user-dialog').modal('show');
    }
  }

  public onSubmitForm() {
    console.log(this.Form);
    if (this.Form.valid) {
      const Value: any = this.Form.value;

      Helpers.setLoading(true);
      let args: any = {
        first_name: Value.first_name,
        last_name: Value.last_name,
        roles: [Value.role]
      };

      if (this.type === 'edit') {
        if (!_.isNull(Value.pwd) && !_.isEmpty(Value.pwd)) {
          args.password = Value.pwd;
        }
        this.Wordpress.users().id(Value.id).update(args).then(resp => {
          this.success();
        }).catch(err => { Helpers.setLoading(false); });
      }

      if (this.type === 'new') {
        let username = _.split(Value.email, '@')[0] + _.split(Value.email, '@')[1];
        args.email = Value.email,
        args.username = username;
        args.password = Value.pwd;
        this.Wordpress.users().create(args).then(resp => {
          this.success();
        }).catch(err => { Helpers.setLoading(false); });
      }
      
    } else {
      (<any>Object).values(this.Form.controls).forEach(element => {
        element.markAsTouched();
      });
    }
  }

  private success() {
    Helpers.setLoading(false);
    $('#user-dialog').modal('hide');
    this.ngOnInit();
    Swal.fire('Succès', "Utilisateur mise à jour avec succès", 'success');
  }

  public onAdd() {
    this.type = 'new';
    this.Form.reset();
    this.Form.get('email').enable();
    this.Form.get('pwd').setValidators([Validators.required]);
    this.Form.get('pwd').updateValueAndValidity();

    $('#user-dialog').modal('show');
  }

}
