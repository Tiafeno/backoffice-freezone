import { Component, OnInit, Input, OnChanges, SimpleChanges, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import * as _ from 'lodash';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import { Helpers } from '../../../helpers';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { FzServicesService } from '../../../_services/fz-services.service';
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
    public ownerClient: any = {};

    private Woocommerce: any;
    private Wordpress: any;
    private supplierSchema: Array<any> = [];
    private error: boolean = false;
    private Tax: number = 20; // Tax de 20%
    @Input() public order: any;

    constructor(
        private apiWC: ApiWoocommerceService,
        private apiWP: ApiWordpressService,
        private cd: ChangeDetectorRef,
        private services: FzServicesService
    ) {
        this.Woocommerce = this.apiWC.getWoocommerce();
        this.Wordpress = this.apiWP.getWPAPI();
    }

    ngOnInit() {
        moment.locale('fr');
    }

    ngAfterViewInit() {
        $("#quotation-view-modal")
            .on('show.bs.modal', e => {
              this.onShowModal();
            })
            .on('hide.bs.modal', e => {
              this.QtItems = [];
              this.Billing = {};
              this.supplierSchema = [];
        });
    }

    public onSendMail(): void | boolean {
        // Ne pas envoyer le devis si le client est toujours en attente
        if (!_.isEmpty(this.ownerClient.company_name) && this.ownerClient.company_status === "pending") {
            Swal.fire('Désolé', "Le client est en attente de confirmation", "warning");
            return false;
        }
        // ne pas envoyer le mail s'il y a encore un founisseur en attente
        if (this.error) {
            Swal.fire("Désolé", "Vous ne pouvez pas envoyer par mail ce devis pour l'instant. Veuillez bien vérifier l'articles des fournisseurs. Merci", "error");
            return false;
        }
        this.QtItems = _.map(this.QtItems, item => {
            // Mettre le prix unitaire pour 0 par default
            // (Le prix sera regenerer automatiquement par woocommerce)
            item.price = '0';
            return item;
        });
        let pricetax: number = (this.Billing.total * this.Tax) / 100;
        let data: any = {
            currency: 'MGA',
            line_items: this.QtItems,
            cart_tax: pricetax.toString()
        };
        Helpers.setLoading(true);
        $('.modal').modal('hide');
        this.Woocommerce.put(`orders/${this.ID}`, data, (err, data, res) => {
            Helpers.setLoading(false);
            // Afficher la boite de dialogue pour l'envoie de mail
            $('#quotation-mail-modal').modal('show');
        });
    }

    /**
     * Cette fonction sera exécuter quand la boit de dialogue s'affiche
     */
    public async onShowModal() {
        this.error = false;
        this.cd.detectChanges();
        Helpers.setLoading(true);

        let aIds: Array<any> = this.getMeta('article_id');
        const ARTICLES = await this.getArticles(_.join(aIds, ',')); // Array of fz_product type
        const CLIENT = await this.getUsers(this.order.customer_id); // Array of user or empty
        this.ownerClient = _.isArray(CLIENT) ? _.clone(CLIENT[0]) : {};
        this.supplierSchema = await this.loadSchema();
        this.supplierSchema = _.flatten(this.supplierSchema);
        this.supplierSchema = _.map(this.supplierSchema, schema => {
            const articleId: number = parseInt(schema.article_id);
            const article: any = _.find(ARTICLES, { id: articleId });
            if (_.isUndefined(article)) return schema;
            // "marge" appartient au produit woocommerce
            // Cette valeur est herité depuis le post type 'product'
            schema.marge = parseInt(article.marge);
            schema.marge_dealer = parseInt(article.marge_dealer, 10);
            schema.marge_particular = parseInt(article.marge_particular, 10);

            let price = parseInt(article.price);
            schema.price = price;

            return schema;
        });

        // Vérifier si la date de revision est périmé
        _.map(ARTICLES, (a) => {
            let dateReview: any = moment(a.date_review);
            let dateLimit: any = moment().subtract(1, 'days');
            if ( dateLimit > dateReview &&  this.order.status !== 'completed') {
                this.error = true;
            }
        });

        if (this.error) {
            $('.modal').modal('hide');
            Helpers.setLoading(false);
            this.cd.detectChanges();
            setTimeout(() => {
                Swal.fire('Désolé', "Article en attente détecté. Veuillez mettre à jours l'article", 'error');
            }, 600);

            return false;
        }

        this.QtItems = _.map(this.Items, product => {
            // Récuperer tous les meta utiliser pour le produit
            let SCHEMAS: any = _.filter(this.supplierSchema, { product_id: product.product_id });
            const allPriceForItem = _.map(SCHEMAS, (schema) => schema.price);
            
            const metaDataSuppliers: any = _.find(product.meta_data, {key: 'suppliers'} as any);
            const metaDataSuppliersValue =  JSON.parse(metaDataSuppliers.value);
            const allTakeForItem = _.map(metaDataSuppliersValue, (supplier) => parseInt(supplier.get, 10));

            // Faire la somme pour tous les nombres d'article ajouter pour chaques fournisseurs
            const take = _.sum(allTakeForItem);
            if (take === 0) {
                $('.modal').modal('hide');
                Helpers.setLoading(false);
                Swal.fire('Désolé', "Fournisseur non definie détecté", 'error');
                return product;
            }
            // Récuperer le prix le plus grand pour chaque fournisseur ajouter
            const price = _.max(allPriceForItem);
            // Vérifier le prix et la quantité ajouter
            if (_.isUndefined(price) || product.quantity > take) {
                product.stock = product.total = product.subtotal = product.price = 0;

                $('.modal').modal('hide');
                Swal.fire('Désolé', 'Quantité ajouter incorrect', 'error');
                return product;
            }
            
            return product;
        });
        console.log('Items:')
        console.log(this.Items);

        console.log('QtItems:')
        console.log(this.QtItems);

        let totalItemsArray: Array<any> = _.map(this.QtItems, item => { return parseInt(item.total, 10); });
        this.Billing.subtotal = _.sum(totalItemsArray);
        this.Billing.total = _.sum(totalItemsArray);

        let priceTax: number = (this.Billing.subtotal * this.Tax) / 100;
        this.Billing.price_tax = priceTax;
        this.Billing.total_tax = parseInt(this.Billing.subtotal) + priceTax;

        this.cd.detectChanges();

        Helpers.setLoading(false);
    }

    ngOnChanges(changes: SimpleChanges): void | boolean {
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
            }).catch(err => resolve([]));
        })
    }

    getUsers(ids: string): Promise<any> {
        return new Promise(resolve => {
            this.Wordpress.users().include(ids).context('edit').then(users => {
                resolve(users);
            }).catch(err => { resolve([]); });
        });
    }

    /**
     * Cette fonction permet de récupérer la valeur d'une propriété
     * définie dans l'item meta "suppliers"
     *
     * @param property
     */
    private getMeta(property: string): Array<any> {
        return _.map(this.Items, item => {
            let metas = item.meta_data;
            let supplier: any = _.find(metas, { key: 'suppliers' });
            if (_.isUndefined(supplier)) return [];
            // récuperer la valeur du meta item
            let Value = !_.isEmpty(supplier.value) ? JSON.parse(supplier.value) : null;
            // Rétourner une tableau vide s'il est vide ou null
            if (_.isNull(Value) || !_.isArray(Value)) return [];
            // Récupere seulement la propriété définie
            return _.map(Value, data => data[property]);
        });
    }

    /**
     * Récupere tous les valeurs du "suppliers" des items dans un tableau
     */
    private loadSchema(): Promise<Array<any>> {
        let container: Array<any> = [];
        return new Promise((resolve) => {
            _.map(this.Items, item => {
                let metas = item.meta_data;
                let supplier: any = _.find(metas, { key: 'suppliers' });
                if (_.isUndefined(supplier)) return;
                let Value = !_.isEmpty(supplier.value) ? JSON.parse(supplier.value) : null;
                if (_.isArray(Value) && !_.isEmpty(Value)) {
                    container.push(Value);
                }
            });

            resolve(container);
        })

    }

    public initQuotation(): void {

    }

}
