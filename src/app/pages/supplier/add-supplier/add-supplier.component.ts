import { Component, OnInit, AfterViewInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import { Helpers } from '../../../helpers';
import { Router } from '@angular/router';
import swal from 'sweetalert2';
import * as _ from 'lodash';
declare var $: any;

@Component({
    selector: 'app-add-supplier',
    templateUrl: './add-supplier.component.html',
    styleUrls: ['./add-supplier.component.css']
})
export class AddSupplierComponent implements OnInit, AfterViewInit {
    public formSupplier: FormGroup;
    public loading: boolean = false;
    private WPAPI: any;
    constructor(
        private api: ApiWordpressService,
        private router: Router,
        private cd: ChangeDetectorRef,
        private zone: NgZone
    ) {
        this.formSupplier = new FormGroup({
            company_name: new FormControl('', Validators.required),
            reference: new FormControl('', Validators.required),
            address: new FormControl(''),
            phone: new FormControl(''),
            first_name: new FormControl('', Validators.required),
            last_name: new FormControl(''),
            mail_commercial_cc: new FormControl([]),
            mail_logistics_cc: new FormControl([]),
            email: new FormControl('', Validators.compose([Validators.email, Validators.required])),
            pwd: new FormControl('', Validators.required)
        });
        this.WPAPI = api.getWPAPI();
    }

    get f() { return this.formSupplier.controls; }

    ngOnInit() {
    }

    ngAfterViewInit() {
    }

    public generatePassword(): void {
        const length = 8;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let password = "";
        for (var i = 0, n = charset.length; i < length; ++i) {
            password += charset.charAt(Math.floor(Math.random() * n));
        }
        this.formSupplier.patchValue({ pwd: password });
    }

    public onSubmit(): void | boolean {
        if (this.formSupplier.invalid) {
            (<any>Object).values(this.formSupplier.controls).forEach(control => {
                control.markAsTouched();
              });
            swal.fire('Désolé', "Veuillez remplire correctement le formulaire", "error");
            return false;
        }
        Helpers.setLoading(true);
        let Value: any = this.formSupplier.value;
        let mail_commercial: Array<string> = _.map(Value.mail_commercial_cc, mail => mail.value);
        let mail_logistics: Array<string> = _.map(Value.mail_logistics_cc, mail => mail.value);
        this.WPAPI.users().create({
            username: Value.reference,
            address: Value.address,
            company_name: Value.company_name,
            phone: Value.phone,
            email: Value.email,
            mail_commercial_cc: _.join(mail_commercial, ','),
            mail_logistics_cc: _.join(mail_logistics, ','),
            last_name: Value.last_name,
            first_name: Value.first_name,
            password: Value.pwd,
            reference: Value.reference
        }).then(resp => {
            this.WPAPI.users().id(resp.id).update({ roles: ['fz-supplier'] })
                .then(user => {
                    Helpers.setLoading(false);
                    this.cd.detectChanges();
                    this.zone.run(() => this.router.navigate(["/supplier", "lists"]));
                })
        }).catch(err => {
            swal.fire('Désolé', err.message, "error");
            Helpers.setLoading(false);
        })
    }

}
