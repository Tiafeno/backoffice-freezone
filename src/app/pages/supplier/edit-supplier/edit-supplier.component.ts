import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Helpers } from '../../../helpers';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import Swal from 'sweetalert2';
import * as _ from 'lodash';

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
		private api: ApiWordpressService
	) {
		this.supplierForm = new FormGroup({
			company_name: new FormControl('', Validators.required),
			reference: new FormControl('', Validators.required),
			address: new FormControl('', Validators.required),
			phone: new FormControl('', Validators.required),
			first_name: new FormControl('', Validators.required),
			last_name: new FormControl('', Validators.required),
			mail_commercial_cc: new FormControl(''),
			mail_logistics_cc: new FormControl(''),
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
				let commercials: Array<string> = _.split(user.mail_commercial_cc, ',');
				let logistics: Array<string> = _.split(user.mail_logistics_cc, ',');
				logistics = _.filter(logistics, logistic => !_.isEmpty(logistic));
				commercials = _.filter(commercials, com => !_.isEmpty(com));
				this.supplierForm.patchValue({
					company_name: user.company_name,
					reference: user.reference,
					address: user.address,
					phone: user.phone,
					first_name: user.first_name,
					last_name: user.last_name,
					email: user.email,
					mail_commercial_cc: commercials,
					mail_logistics_cc: logistics,
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
		let Value: any = this.supplierForm.value;
		let mail_commercials: Array<string> = _.map(Value.mail_commercial_cc, mail => mail.value);
		let mail_logistics: Array<string> = _.map(Value.mail_logistics_cc, mail => mail.value);
		this.WPAPI.users().id(this.ID).update({
			address: this.supplierForm.value.address,
			company_name: this.supplierForm.value.company_name,
			phone: this.supplierForm.value.phone,
			last_name: this.supplierForm.value.last_name,
			first_name: this.supplierForm.value.first_name,
			reference: this.supplierForm.value.reference,
			mail_commercial_cc: _.join(mail_commercials, ','),
			mail_logistics_cc: _.join(mail_logistics, ',')
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
