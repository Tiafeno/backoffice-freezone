import { Component, OnInit, Input, OnChanges, SimpleChanges, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import * as _ from 'lodash';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import { Helpers } from '../../../helpers';
import { HttpClient } from '@angular/common/http';
import { config } from '../../../../environments/environment';
import { Scheduler } from 'rxjs/Scheduler';
declare var $: any;

@Component({
    selector: 'app-quotation-view',
    templateUrl: './quotation-view.component.html',
    styleUrls: ['./quotation-view.component.css']
})
export class QuotationViewComponent implements OnInit, OnChanges, AfterViewInit {
    public ID: number = 0;
    public Quotation: any = {};
    public Items: Array<any> = [];
    public QtItems: Array<any> = [];
    public querySupplierProducts: Array<any> = [];
    public Billing: any = {};
    public billingAdress: any = {}; // adresse de facturation
    public shippingAdress: any = {}; // adresse de facturation
    public loading: boolean = false;
    private Woocommerce: any;
    private Wordpress: any;
    private supplierSchema: Array<any> = [];
    @Input() order: any;
    constructor(
        private apiWC: ApiWoocommerceService,
        private apiWP: ApiWordpressService,
        private cd: ChangeDetectorRef
    ) {
        this.Woocommerce = this.apiWC.getWoocommerce();
        this.Wordpress = this.apiWP.getWPAPI();
    }

    ngOnInit() {
    }

    ngAfterViewInit() {
        $('#quotation-view-modal').on('show.bs.modal', e => {
            this.onShowModal();
        });

        $('#quotation-view-modal').on('hide.bs.modal', e => {
            this.QtItems = [];
            this.Billing = {};
            this.supplierSchema = [];
        });
    }

    public onSendMail() {
        this.QtItems = _.map(this.QtItems, item => {
            item.price = '0';
            return item;
        });
        let data: any = { line_items: this.QtItems };
        Helpers.setLoading(true);
        $('.modal').modal('hide');
        this.Woocommerce.put(`orders/${this.ID}`, data, (err, data, res) => {
            let order: any = JSON.parse(res);
            Helpers.setLoading(false);
            // afficher la boite de dialogue pour l'envoie de mail
            $('#quotation-mail-modal').modal('show');
        });
    }

    public async onShowModal() {
        this.loading = true;
        this.cd.detectChanges();
        Helpers.setLoading(true);

        let productIds: Array<any> = this.getMeta('article_id');
        this.getSchema();
        let pIds: string = _.join(productIds, ',');
        const ARTICLES = await this.getArticles(pIds);
        let supplierIds: Array<any> = this.getMeta('supplier');
        let sIds: string = _.join(supplierIds, ',');

        const USERS = await this.getUsers(sIds);
        this.supplierSchema = _.flatten(this.supplierSchema);
        this.supplierSchema = _.map(this.supplierSchema, schema => {
            let user: any = _.find(USERS, { id: schema.supplier });
            let article: any = _.find(ARTICLES, { user_id: schema.supplier });
            if (_.isUndefined(user) || _.isUndefined(article)) return schema;
            schema.commission = parseInt(user.commission);
            schema.price = parseInt(article.price);

            return schema;
        });

        //TODO: Vérifier la quantité des articles

        this.QtItems = _.map(this.Items, item => {
            // Récuperer tous les meta utiliser pour le produit
            let SCHEMAS: any = _.filter(this.supplierSchema, { product_id: item.product_id });

            let allPriceForItem = _.map(SCHEMAS, (schema) => schema.price);
            let allTakeForItem = _.map(SCHEMAS, (schema) => parseInt(schema.get));

            // Faire la somme pour tous les nombres d'article ajouter pour chaques fournisseurs
            let take = _.sum(allTakeForItem);

            // Récuperer le prix le plus grand pour chaque fournisseur ajouter
            let price = _.max(allPriceForItem);
            if (_.isUndefined(price)) { console.warn("Aucun prix n'est definie"); return item; }
            let commission = _.find(SCHEMAS, schema => { return schema.price === price; }).commission;
            let poucentage: number = (price * commission) / 100;
            let total: number = (price + poucentage) * take;
            total = Math.round(total);

            item.stock = _.clone(take);
            item.total = total.toString();
            item.subtotal = total.toString();
            item.price = Math.round(total / item.quantity);

            return item;
        });

        let totalItemsArray: Array<any> = _.map(this.QtItems, item => { return item.total; });
        this.Billing.total = _.sum(totalItemsArray);
        this.Billing.subtotal = _.sum(totalItemsArray);

        this.loading = false;
        this.cd.detectChanges();

        Helpers.setLoading(false);
    }

    ngOnChanges(changes: SimpleChanges): void | boolean {
        console.log('Change fire!');
        if (!_.isUndefined(changes.order.currentValue) && !_.isEmpty(changes.order.currentValue)) {
            this.ID = changes.order.currentValue.id;
            this.Quotation = _.cloneDeep(changes.order.currentValue);
            this.Items = _.cloneDeep(this.Quotation.line_items.line_items);
            this.billingAdress = _.clone(this.Quotation.billing);
            this.shippingAdress = _.clone(this.Quotation.shipping);

            return true;
        }
    }

    getArticles(ids: string): Promise<any> {
        return new Promise(resolve => {
            this.Wordpress.fz_product().include(ids).then(fzProducts => {
                resolve(fzProducts);
            });
        })
    }

    getUsers(ids: string): Promise<any> {
        return new Promise(resolve => {
            this.Wordpress.users().include(ids).then(users => {
                resolve(users);
            });
        });
    }

    private getMeta(property: string): Array<any> {
        return _.map(this.Items, item => {
            let metas = item.meta_data;
            let supplier: any = _.find(metas, { key: 'suppliers' });
            if (_.isUndefined(supplier)) return [];
            let Value = !_.isEmpty(supplier.value) ? JSON.parse(supplier.value) : null;
            if (_.isNull(Value) || !_.isArray(Value)) return [];
            return _.map(Value, data => data[property]);
        });
    }

    private getSchema() {
        _.map(this.Items, item => {
            let metas = item.meta_data;
            let supplier: any = _.find(metas, { key: 'suppliers' });
            if (_.isUndefined(supplier)) return;
            let Value = !_.isEmpty(supplier.value) ? JSON.parse(supplier.value) : null;
            if (_.isNull(Value) || !_.isArray(Value)) return;

            this.supplierSchema.push(Value);
        });
    }

    public initQuotation(): void {

    }

}
