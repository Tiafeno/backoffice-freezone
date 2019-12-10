import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FzServicesService } from '../../../_services/fz-services.service';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Helpers } from '../../../helpers';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/zip';
import { HttpClient } from '@angular/common/http';
import { config } from '../../../../environments/environment';

@Component({
    selector: 'app-product-edit',
    templateUrl: './product-edit.component.html',
    styleUrls: ['./product-edit.component.css']
})
export class ProductEditComponent implements OnInit {
    private WC: any;
    private ID: number;
    private Product: any;
    public Form: FormGroup;
    public Categories: Array<any> = [];
    public tinyMCESettings: any = {
        language_url: '/assets/js/langs/fr_FR.js',
        menubar: false,
        content_css: [
            '//fonts.googleapis.com/css?family=Montserrat:300,300i,400,400i',
            '//www.tinymce.com/css/codepen.min.css'
        ],
        content_style: ".mce-content-body p { margin: 5px 0; }",
        inline: false,
        statusbar: true,
        resize: true,
        browser_spellcheck: true,
        min_height: 320,
        height: 320,
        toolbar: 'undo redo | bold italic backcolor  | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat ',
        plugins: ['lists'],
    };
    constructor(
        private fzServices: FzServicesService,
        private route: ActivatedRoute,
        private apiWC: ApiWoocommerceService,
        private Http: HttpClient
    ) {
        this.WC = this.apiWC.getWoocommerce();
        this.Form = new FormGroup({
            name: new FormControl('', Validators.required),
            description: new FormControl(''),
            sku: new FormControl('', Validators.required),
            categorie: new FormControl('', Validators.required)
        })
    }

    get f() { return this.Form.controls; }

    ngOnInit() {
        this.route.parent.params.subscribe(params => {
            this.ID = params.id;
            Helpers.setLoading(true);
            let Categories: Observable<any> = this.fzServices.loadCategories();
            this.WC.get(`products/${this.ID}`, (err, data, res) => {
                this.Product = JSON.parse(res);
                if (!_.isUndefined(this.Product.code)) {
                    Swal.fire('Désolé', this.Product.message, 'error');
                    return false;
                }
                Observable.zip(Categories).subscribe(results => {
                    this.Categories = _.isEmpty(this.Categories) ? _.filter(results[0], ctg => ctg) : this.Categories; // TODO: Ne pas afficher les categories parents
                    let inputCtg: Array<number> = _.map(this.Product.categories, ctg => { return ctg.id });
                    let _marge: any = _.find(this.Product.meta_data, { key: '_fz_marge' });
                    let _marge_dealer: any = _.find(this.Product.meta_data, { key: '_fz_marge_dealer' });
                    _marge = _.isUndefined(_marge) || _.isEmpty(_marge) ? 0 : _marge.value;
                    _marge_dealer = _.isUndefined(_marge_dealer) || _.isEmpty(_marge_dealer) ? 0 : _marge_dealer.value;
                    this.Form.patchValue({
                        name: this.Product.name,
                        description: this.Product.description,
                        sku: this.Product.sku,
                        marge: _marge,
                        marge_dealer: _marge_dealer,
                        categorie: inputCtg
                    });
                    Helpers.setLoading(false);
                });

            });
        })
    }

    async onSubmit() {
        if (this.Form.invalid || !this.Form.dirty) {
            return false;
        }
        let Value: any = this.Form.value;
        let Ctg: Array<any> = _.map(Value.categorie, ctg => { return { id: ctg }; });
        let data: any = {
            name: Value.name,
            description: Value.description,
            sku: Value.sku,
            categories: _.clone(Ctg),
        };
        Helpers.setLoading(true);
        this.WC.put(`products/${this.ID}`, data, async (err, data, res) => {
            let formdata = new FormData();
            formdata.append('title', Value.name);
            formdata.append('description', Value.description);
            let update = await this.Http.post<any>(`${config.apiUrl}/product/update/${this.ID}`, formdata);
            update.subscribe(resp => {
                Helpers.setLoading(false);
                let response: any = JSON.parse(res);
                if (!_.isUndefined(response.code)) {
                    Swal.fire('Désolé', response.message, 'error');
                    return false;
                }
                Swal.fire('Succès', "Produit mis à jour avec succès", 'success');
            });

        });
    }

}
