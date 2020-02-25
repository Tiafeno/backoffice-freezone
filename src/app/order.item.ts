import * as _ from 'lodash';
import * as moment from 'moment';
import { Metadata } from "./metadata";
import { FzProduct } from './supplier';
import { CONDITION } from './defined';

export class OrderItem {
    id: number;
    meta_data: Array<Metadata>;
    name: string;
    price: number;
    product_id: number;
    quantity: number;
    position?: any;
    total: any;
    subtotal?: any;
    sku: any;
    variation_id: number;
}

export class wpOrder {
    public id: number;
    public meta_data: Array<Metadata>;
    public position: any;
    public date_created: string;
    public date_send: string;
    public line_items?: Array<OrderItem>;
    public line_items_zero?: Array<OrderItem>;
    public billing?: any;
    public shipping?: any;
    public customer_id: number;
    get orderState() {
        let item = _.find(this.meta_data, { key: 'position' });
        if (_.isUndefined(item)) return null;
        return item.value;
    };
    /**
     * 0: En attente
     * 1: Envoyer
     * 2: Rejetés
     * 3: Acceptée
     * 4: Terminée
     */
    constructor(order: OrderItem) {
        moment.locale('fr');
        (Object.keys(order)).forEach((element, index) => {
            this[element] = _.clone(order[element]);
        });
    }

    get posValue(): string {
        const positions: Array<{ key: number, value: string }> = [
            { key: 0, value: 'En attente' },
            { key: 1, value: 'Envoyer' },
            { key: 2, value: 'Rejetés' },
            { key: 3, value: 'Acceptée' },
            { key: 4, value: 'Terminée' },
        ];
        let position = parseInt(this.position, 10);
        if (_.isNaN(position)) return 'En attente';
        let val: any = _.find(positions, { 'key': position });
        val = _.isUndefined(val) ? 'En attente' : val.value;
        return `<span class="badge badge-default">${val}</span>`;
    }

    get dateCreate(): string {
        let date = moment(this.date_created);
        if (!date.isValid()) return this.date_created;
        return date.format('LLL');
    }
}

export class wpItemOrder {
    id?: number;
    meta_data: Array<Metadata>;
    name: string;
    price: number;
    product_id: number;
    quantity: number;
    position?: any;
    total: any;
    subtotal?: any;
    sku: any;
    variation_id: number;
    // Cette variable contiens les articles (fz_product) qui sont selectionnerpour cette item
    private _articles: Array<FzProduct> = [];
    constructor(item: OrderItem) {
        (Object.keys(item)).forEach((element, index) => {
            this[element] = _.clone(item[element]);
        });
    }
    set articles(value) {
        this._articles = value;
    }
    get articles(): Array<FzProduct> {
        return this._articles;
    }
    /**
    * 0: Aucun
    * 1: Remise
    */
    get discountTypeFn(): number {
        let type = _.find(this.meta_data, { key: 'discount_type' });
        if (_.isUndefined(type)) return 0;
        return _.isNaN(parseInt(type.value)) ? 0 : parseInt(type.value);
    }
    get discountFn(): number {
        let discount: any = _.find(this.meta_data, { key: 'discount' });
        if (_.isUndefined(discount) || _.isNaN(parseInt(discount.value)) || parseInt(discount.value) === 0) return 0;
        return parseInt(discount.value);
    };
    get discountPercentFn(): number { return (this.price * this.discountFn) / 100; };
    get isQtyOverride(): boolean { return this.hasStockRequestFn; };
    get priceFn(): any {
        switch (this.discountTypeFn) {
            //case 2: return this.price + this.discountPercentFn; // Rajout
            default: return this.price; // Remise & Aucun
        }
    };
    // Depends: articles (property)
    get takeMetaSuppliersLines(): Array<any> {
        const conditions: Array<{ key: number, value: string }> = CONDITION;
        //let currentItemArticlesIds: Array<number> = this.articleIdsFn;
        //let currentItemArticles: Array<FzProduct> = _.filter(this.articles, a => _.includes(currentItemArticlesIds, a.id));
        let metaSuppliers: Array<any> = this.metaSupplierDataFn;
        return _(metaSuppliers).map(line => {
            let hisArticle: FzProduct = _.find(this.articles, { id: parseInt(line.article_id) });
            line.condition = _.find(conditions, { key: _.isUndefined(hisArticle) ? 0 : hisArticle.condition });
            return line;
        }).value();
    }
    get subTotalNetFn(): number {
        const lines: Array<any> = this.takeMetaSuppliersLines;
        let qty: number = 0;
        for (let line of lines) {
            switch (line.condition.key) {
                case 0: qty += parseInt(line.get); break;
                default: break;
            }
        }
        qty = (0 === qty) ? this.quantity : qty;
        switch (this.discountTypeFn) {
            //case 2: return qty * (this.price - this.discountPercentFn);
            case 1: return (this.price - this.discountPercentFn) * qty;
            case 0:
            default: return qty * this.price;
        }
    }
    // Vérifier s'il a une quantité demander
    get hasStockRequestFn(): boolean {
        const stockR = _.find(this.meta_data, { key: 'stock_request' });
        if (_.isUndefined(stockR)) return false;
        return _.isEqual(parseInt(stockR.value, 10), 0) ? false : true;
    };
    get articleIdsFn(): Array<number> {
        const dataParser = this.metaSupplierDataFn;
        return _(dataParser).map(line => parseInt(line.article_id, 10)).value();
    }
    get metaSupplierDataFn(): Array<any> {
        const suppliers = _.find(this.meta_data, { key: 'suppliers' });
        if (_.isUndefined(suppliers)) return [];
        const dataParser: Array<any> = JSON.parse(suppliers.value);
        return dataParser;
    }
    

    // Depends: articles (property)
    get qtyUI(): string {
        const lines: Array<any> = this.takeMetaSuppliersLines;
        let ui: string = '';
        let qty: number = 0;
        for (let line of lines) {
            switch (line.condition.key) {
                case 0: qty += parseInt(line.get); break;
                case 1: ui += '*'; break;
                case 3: ui += "**"; break;
                default:  break;
            }
        }
        qty = (0 === qty) ? this.quantity : qty;
        return `${qty}<span style="color:red">${ui}</span>`;
    }
}