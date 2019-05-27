import { Component, OnInit, AfterViewInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import { Helpers } from '../../../helpers';
import { Router } from '@angular/router';
import swal from 'sweetalert2';
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
            address: new FormControl('', Validators.required),
            phone: new FormControl('', Validators.required),
            first_name: new FormControl('', Validators.required),
            last_name: new FormControl('', Validators.required),
            email: new FormControl('', [Validators.email, Validators.required]),
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
            swal.fire('Désolé', "Veuillez remplire correctement le formulaire", "error");
            return false;
        }
        Helpers.setLoading(true);
        this.WPAPI.users().create({
            username: this.formSupplier.value.reference,
            address: this.formSupplier.value.address,
            company_name: this.formSupplier.value.company_name,
            phone: this.formSupplier.value.phone,
            email: this.formSupplier.value.email,
            last_name: this.formSupplier.value.last_name,
            first_name: this.formSupplier.value.first_name,
            password: this.formSupplier.value.pwd,
            reference: this.formSupplier.value.reference
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
