import { Component, OnInit, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import * as Papa from 'papaparse';
import * as _ from 'lodash';
import * as moment from 'moment';
declare var $: any;
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ApiWordpressService } from '../../_services/api-wordpress.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/zip';
import { Helpers } from '../../helpers';
import { ApiWoocommerceService } from '../../_services/api-woocommerce.service';

@Component({
    selector: 'app-import-article',
    templateUrl: './import-article.component.html',
    styleUrls: ['./import-article.component.css']
})
export class ImportArticleComponent implements OnInit {
    public Form: FormGroup;
    public Files: any;
    private Columns: any = {
        Title: null,
        SupplierRef: null,
        Qty: 1,
        Price: 0,
        PriceDealer: 0,
        LastUpdate: null, // Date
        Categorie: '',
        Mark: '',
        Marge: '',
        MargeDealer: '',
        Description: ''
    };

    public loopColumn: Array<any> = [
        { key: 'Title', label: 'Titre' },
        { key: 'SupplierRef', label: 'Réference du fournisseur' },
        { key: 'Price', label: 'Prix fournisseur' },
        { key: 'PriceDealer', label: 'Prix revendeur' },
        { key: 'Qty', label: 'Quantité' },
        { key: 'LastUpdate', label: 'Date de revision' },
        { key: 'Categorie', label: 'Categories' },
        { key: 'Mark', label: 'Marque' },
        { key: 'Marge', label: 'Marge en %' },
        { key: 'MargeDealer', label: 'Marge de revendeur' },
        { key: 'Description', label: 'Description' },
    ];

    public Inputs: Array<any>;
    private Wordpress: any;
    private Woocommerce: any;

    @Output() refresh = new EventEmitter();
    constructor(
        private apiWP: ApiWordpressService,
        private apiWC: ApiWoocommerceService,
        private cd: ChangeDetectorRef
    ) {
        this.Form = new FormGroup({ csv: new FormControl({ value: '' }, Validators.required) });
        this.Wordpress = this.apiWP.getWPAPI();
        this.Woocommerce = this.apiWC.getWoocommerce();
    }

    ngOnInit() {
    }

    onFileChange($event): void | boolean {
        this.Files = $event.target.files[0];
        this.Form.controls['csv'].setValue(this.Files ? this.Files.name : ''); // <-- Set Value for Validation

        if (_.isUndefined(this.Files)) {
            this.Inputs = [];
            return false;
        }
        Papa.parse(this.Files, {
            complete: (results) => {
                if (results.data.length > 0) {
                    this.Inputs = results.data[0];
                    this.cd.detectChanges();
                }
            }
        });
    }

    onSelectColumn($event, index) {
        const element: any = $event.currentTarget;
        const key: string = $(element).val();
        this.Columns[key] = index;

        console.log(this.Columns);
    }

    onSubmit(): void | boolean {
        if (this.Form.invalid) return false;
        Helpers.setLoading(true);
        Papa.parse(this.Files, {
            delimiter: ';',
            preview: 0,
            step: async (results: any, parser: any) => {
                parser.pause();
                if (results || results.data) {
                    const column: any = results.data;
                    const price: number = parseInt(column[this.Columns.Price], 10);
                    if (_.isNaN(price)) {
                        console.log('is NaN!');
                        parser.resume();
                        return;
                    }

                    const categorie: string = column[this.Columns.Categorie];
                    let _categories: Array<any> = await this.createCategories(_.split(categorie, ','));
                    _categories = _.map(_categories, (ctg) => { return {id: ctg.id}; });
                    const args: object = {
                        type: 'simple',
                        status: 'publish',
                        name: column[this.Columns.Title],
                        regular_price: '0',
                        description: column[this.Columns.Description],
                        short_description: '',
                        categories: _categories,
                        attributes: [
                            {
                                name: 'brands',
                                options: column[this.Columns.Mark],
                                visible: true
                            }
                        ],
                        meta_data: [
                            { key: '_fz_marge', value: column[this.Columns.Marge] },
                            { key: '_fz_marge_dealer', value: column[this.Columns.MargeDealer] }
                        ],
                        images: []
                    };
                    const productRef = this.createProduct(args);
                    const supplier = this.Wordpress.users().roles('fz-supplier').filter(
                      {
                        meta_key: 'reference',
                        meta_value: column[this.Columns.SupplierRef]
                      });
                    Observable.zip(productRef, supplier).subscribe(dataObs => {
                        // return value with pagination (property: _paging)
                        const productObs: any = _.isArray(dataObs) ? dataObs[0] : dataObs;
                        const supplierObs: any = _.isArray(dataObs[1]) && !_.isUndefined(dataObs[1][0]) ? dataObs[1][0] : null;
                        if ( ! _.isObject(productObs) || ! _.isObject(supplierObs)) {
                            parser.resume();
                            return;
                        }

                        const _price: string = column[this.Columns.Price];
                        const _priceDealer: string = column[this.Columns.PriceDealer];

                        this.Wordpress
                            .fz_product()
                            .create({
                                title: _.isNull(this.Columns.Title) ? productObs.name : column[this.Columns.Title],
                                content: productObs.description,
                                status: 'publish',
                                price: _price,
                                price_dealer: _priceDealer,
                                date_add: moment().format('YYYY-MM-DD HH:mm:ss'),
                                date_review: moment().format('YYYY-MM-DD HH:mm:ss'),
                                product_id: productObs.id,
                                total_sales: this.Columns.Qty.toString(),
                                user_id: supplierObs.id,
                                product_cat: _.map(productObs.categories, (ctg) => ctg.id)
                            }).then(() => {
                                parser.resume();
                            }).catch(function (err) {
                                parser.abord();
                            });
                    });
                } else {
                    parser.resume();
                }
            },
            encoding: 'UTF-8',
            complete: (results: any) => {
                console.log('Finished:', results.data);
                $('#import-article-modal').modal('hide');
                Helpers.setLoading(false);
                this.refresh.emit();
            },
            error: this.errorFn,
            dynamicTyping: true,
            download: false,
            before: (file, inputElement) => {

            }
        });
    }

    createProduct(args: any): Promise<any> {
        return new Promise((resolve, reject) => {
            this.Woocommerce.post('products', args, (err, data, response) => {
                const product: any = JSON.parse(response);
                this.Woocommerce.put(`products/${product.id}`, { sku: `PRD${product.id}` }, (err, data, res) => {
                    const response: any = JSON.parse(res);
                    if (_.isUndefined(response.code)) {
                        resolve(response);
                    } else {
                        resolve({ id: response.data.resource_id, name: '', description: '' });
                    }
                });
            });
        });
    }

    private createCategories(ctgs: any): Promise<Array<any>> {
        const results: Array<any> = [];
        return new Promise(async (resolve, reject) => {
            let categories: Array<string> = _.map(ctgs, ctg => _.trim(ctg));
            categories = _.filter(categories, ctg => !_.isEmpty(ctg));
            if (_.isEmpty(categories)) resolve([]);

            for (const ctg of categories) {
                const categorie: any = await this.createProductCategory(ctg);
                if (!categorie) continue;
                results.push(categorie);
            }

            resolve(results);

        });
    }

    private createProductCategory(category: string): Promise<any> {
        return new Promise((resolve) => {
            if (_.isEmpty(category)) resolve(false);
            const args: any = {
                name: category
            };
            this.Woocommerce.post('products/categories', args, (err, data, res) => {
                const response: any = JSON.parse(res);
                if (_.isUndefined(response.code)) {
                    resolve(response);
                } else {
                    if (response.code === 'term_exists') {
                        resolve({ id: response.data.resource_id });
                    }
                    resolve(false);
                }
            });
        });
    }


    errorFn(err: any, file: any) {
        console.warn('ERROR:', err, file);
        Helpers.setLoading(false);
    }

}
