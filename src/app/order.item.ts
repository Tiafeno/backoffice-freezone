import * as _ from 'lodash';
import * as moment from 'moment';
import { Metadata } from "./metadata";

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
        let val: any = _.find(positions, { 'key' : position });
        val = _.isUndefined(val) ? 'En attente' : val.value;
        return `<span class="badge badge-default">${val}</span>`;
    }

    get dateCreate(): string {
        let date = moment(this.date_created);
        if (!date.isValid()) return this.date_created;
        return date.format('LLL');
    }
}