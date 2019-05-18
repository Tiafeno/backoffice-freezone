import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Helpers } from '../../../helpers';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-supplier',
  templateUrl: './edit-supplier.component.html',
  styleUrls: ['./edit-supplier.component.css']
})
export class EditSupplierComponent implements OnInit, AfterViewInit {
  public ID: number;
  public supplierForm: FormGroup;
  public pwdForm: FormGroup;
  private WPAPI: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private Http: HttpClient,
    private api: ApiWordpressService
  ) {
    this.supplierForm = new FormGroup({
      company_name: new FormControl('', Validators.required),
      reference: new FormControl('', Validators.required),
      address: new FormControl('', Validators.required),
      phone: new FormControl('', Validators.required),
      first_name: new FormControl('', Validators.required),
      last_name: new FormControl('', Validators.required),
      commission: new FormControl(0, Validators.required),
      email: new FormControl({ value: '', disabled: true }, [Validators.email, Validators.required])
    });

    this.pwdForm = new FormGroup({
      pwd: new FormControl('', Validators.required)
    })

    this.WPAPI = this.api.getWPAPI();
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    Helpers.setLoading(true);
    this.route.parent.params.subscribe(params => {
      this.ID = params.id;
      this.WPAPI.users().id(this.ID).context('edit').then(user => {
        this.supplierForm.patchValue({
          company_name: user.company_name,
          reference: user.reference,
          address: user.address,
          phone: user.phone,
          first_name: user.first_name,
          last_name: user.last_name,
          commission: user.commission,
          email: user.email
        });

        Helpers.setLoading(false);
      });
    });
  }

  get f() { return this.supplierForm.controls; }

  onSubmitEdit(): void | any {
    if (this.supplierForm.invalid || !this.supplierForm.dirty) {
      return false;
    }
    Helpers.setLoading(true);
    this.WPAPI.users().id(this.ID).update({
      address: this.supplierForm.value.address,
      company_name: this.supplierForm.value.company_name,
      phone: this.supplierForm.value.phone,
      last_name: this.supplierForm.value.last_name,
      first_name: this.supplierForm.value.first_name,
      commission: this.supplierForm.value.commission,
      reference: this.supplierForm.value.reference
    }).then(user => {
      Swal.fire("Succès", "Modification effectuer avec succès", 'success');
      Helpers.setLoading(false);
    }).catch(err => {
      Swal.fire('Désolé', err.message, 'error');
      Helpers.setLoading(false);
    })
  }

  onChangePwd(): void | any {
    if (this.pwdForm.invalid) {
      return false;
    }
    Helpers.setLoading(true);
    this.WPAPI.users().id(this.ID).update({ password: this.pwdForm.value.pwd })
      .then(user => {
        this.pwdForm.patchValue({ pwd: '' });
        Helpers.setLoading(false);
        Swal.fire('Succès', "Mot de passe modifier avec succès", 'success');
      })

  }

}
