import { Component, OnInit, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import * as Papa from 'papaparse';
import * as _ from 'lodash';
declare var $: any;
import { FormControl, FormGroup, Validators } from '@angular/forms';
import 'rxjs/add/observable/zip';
import { Helpers } from '../../helpers';
import { HttpClient } from '@angular/common/http';
import { config } from "../../../environments/environment";
import { Observable } from 'rxjs';

@Component({
    selector: 'app-import-article',
    templateUrl: './import-article.component.html',
    styleUrls: ['./import-article.component.css']
})
export class ImportArticleComponent implements OnInit {
    public Form: FormGroup;
    public Files: any;
    public Inputs: Array<any>;
    private Columns: any = {
        ID: '',
        Title: '',
        SupplierRef: '',
        Qty: '',
        Price: '', // Prix pour le fournisseur
        LastUpdate: '', // Date
        Categorie: '',
        Mark: '',
        Marge: '',
        MargeDealer: '',
        MargeParticular: '',
        Description: ''
    };
    public loopColumn: Array<any> = [
        { key: '', label: 'Selectionner un colonne' },
        { key: 'ID', label: 'Identification' },
        { key: 'Title', label: 'Titre' },
        { key: 'SupplierRef', label: 'Réference du fournisseur' },
        { key: 'Price', label: 'Prix fournisseur' },
        { key: 'Qty', label: 'Quantité' },
        { key: 'LastUpdate', label: 'Date de revision' },
        { key: 'Categorie', label: 'Categories' },
        { key: 'Mark', label: 'Marque' },
        { key: 'Marge', label: 'Marge UF' },
        { key: 'MargeDealer', label: 'Marge de revendeur' },
        { key: 'MargeParticular', label: 'Marge particulier' },
        { key: 'Description', label: 'Description' },
    ];

    @Output() refresh = new EventEmitter();
    constructor(
        private Http: HttpClient,
        private cd: ChangeDetectorRef
    ) {
        this.Form = new FormGroup({
            csv: new FormControl({ value: '' }, Validators.required),
            isUpdate: new FormControl(false)
        });
    }

    ngOnInit() { }

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
    }

    onSubmit(): void | boolean {
        if (this.Form.invalid && this.Form.dirty) return false;
        Helpers.setLoading(true);
        Papa.parse(this.Files, {
            delimiter: ';',
            preview: 0,
            step: (results: any, parser: any) => {
                parser.pause();
                const VALUE: any = this.Form.value;
                if (results || results.data) {
                    let query: Observable<any>;
                    const Form: FormData = new FormData();
                    const column: any = results.data;
                    const price: number = parseInt(column[this.Columns.Price], 10);
                    if (!VALUE.isUpdate && _.isNaN(price)) {
                        console.log('is NaN!');
                        parser.resume();
                        return;
                    }
                    Form.append('id', column[this.Columns.ID]);
                    Form.append('name', column[this.Columns.Title]);
                    Form.append('regular_price', '0');
                    Form.append('price', column[this.Columns.Price]); // Prix fournisseur
                    Form.append('marge', column[this.Columns.Marge]);
                    Form.append('marge_dealer', column[this.Columns.MargeDealer]);
                    Form.append('marge_particular', column[this.Columns.MargeParticular]);
                    Form.append('description', column[this.Columns.Description]);
                    Form.append('short_description', column[this.Columns.Description]);
                    Form.append('mark', column[this.Columns.Mark]);
                    Form.append('reference', column[this.Columns.SupplierRef]);
                    Form.append('quantity', column[this.Columns.Qty]);
                    Form.append('categories', column[this.Columns.Categorie]);
                    if (VALUE.isUpdate) {
                        query = this.Http.post<any>(`${config.apiUrl}/import/csv/update`, Form);
                    } else { query = this.Http.post<any>(`${config.apiUrl}/import/csv`, Form); }
                    query.subscribe(resp => {
                        console.log(resp);
                        parser.resume();
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
            before: (file, inputElement) => { }
        });
    }



    errorFn(err: any, file: any) {
        console.warn('ERROR:', err, file);
        Helpers.setLoading(false);
    }

}
