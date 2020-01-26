import { Component, OnInit, Input, OnChanges, SimpleChanges, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import * as _ from 'lodash';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import { Helpers } from '../../../helpers';
import Swal, { SweetAlertType } from 'sweetalert2';
import * as moment from 'moment';
import { FzServicesService } from '../../../_services/fz-services.service';
import { OrderItem, wpItemOrder, wpOrder } from '../../../order.item';
import { DEFINE_FREEZONE } from '../../../defined';
import { FzProduct } from '../../../supplier';
declare var $: any;

@Component({
    selector: 'app-quotation-view',
    templateUrl: './quotation-view.component.html',
    styleUrls: ['./quotation-view.component.css']
})
export class QuotationViewComponent implements OnInit, OnChanges, AfterViewInit {
    public ID: number = 0;
    public Quotation: wpOrder;
    public Articles: Array<FzProduct> = [];
    private Items: Array<wpItemOrder> = [];
    public QtItems: Array<wpItemOrder> = [];
    public querySupplierProducts: Array<any> = [];
    public Billing: any = {};
    public billingAddress: any = {}; // adresse de facturation
    public shippingAddress: any = {}; // adresse de facturation
    public ownerClient: any = {};
    public costTransport: number; // en ariry
    public minCostWithTransport: number; // en ariry

    private Woocommerce: any;
    private Wordpress: any;
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
        this.costTransport = DEFINE_FREEZONE.COST_TRANSPORT;
        this.minCostWithTransport = DEFINE_FREEZONE.MIN_TRANSPORT_WITH_COST;
    }

    ngOnInit() {
        moment.locale('fr');
    }

    ngAfterViewInit() {
        $("#quotation-view-modal")
            .on('show.bs.modal', e => { this.onShowModal(); })
            .on('hide.bs.modal', e => {
                this.Billing = {};
            });
    }

    public onResetItems() {
        this.QtItems = [];
    }

    public onSendMail() {
        // Si la position ne sont pas: Envoyer, Rejeter, Accepter & Terminée
        if (!_.includes([1, 2, 3, 4], parseInt(this.order.position, 10))) {
            // Ne pas envoyer le devis si le client est toujours en attente
            if (!_.isEmpty(this.ownerClient.company_name) && this.ownerClient.company_status === "pending") {
                Swal.fire('Désolé', "L'entreprise est en attente de confirmation", "warning");
                return false;
            }
            // Ne pas envoyer le devis si le compte particulier est en attente
            if (this.ownerClient.pending == 1 || this.ownerClient.disable == 1) {
                Swal.fire('Désolé', "Le client est en attente de confirmation ou désactiver", "warning");
                return false;
            }
            // ne pas envoyer le mail s'il y a encore un founisseur en attente
            if (this.error) {
                Swal.fire("Désolé", "Vous ne pouvez pas envoyer par mail ce devis pour l'instant. Veuillez bien vérifier l'articles des fournisseurs. Merci", "error");
                return false;
            }
        }
        const dataItemForm = _.map(this.QtItems, (item:any) => {
            // Mettre le prix unitaire pour 0 par default
            // (Le prix sera regenerer automatiquement par woocommerce)
            item.price = '0';
            return item;
        });
        let data: any = { currency: 'MGA', line_items: dataItemForm };
        Helpers.setLoading(true);
        $('.modal').modal('hide');
        this.Woocommerce.put(`orders/${this.ID}`, data, (err, data, res) => {
            Helpers.setLoading(false);
            // Afficher la boite de dialogue pour l'envoie de mail
            $('#quotation-mail-modal').modal('show');
        });
    }

    public errorOccured(title: string, message: string, code: SweetAlertType) {
        this.error = true;
        Swal.fire(title, message, code);
        Helpers.setLoading(false);
        $('.modal').modal('hide');
    }

    /**
     * Cette fonction sera exécuter quand la boit de dialogue s'affiche
     */
    public async onShowModal() {
        this.error = false;
        this.cd.detectChanges();
        Helpers.setLoading(true);
        let aIds: Array<any> = _<Array<wpItemOrder>>(this.Items).map(item => {
            let dataSuppliers = item.metaSupplierDataFn;
            if (_.isEmpty(dataSuppliers)) return null;
            return _(dataSuppliers).map(sup => parseInt(sup.article_id, 10)).value();
        }).flatten().filter(v => v !== null).value();
        // Recuperer tous les articles ajouter pour ces items par une requete.
        if (!_.isEmpty(aIds)) {
            await this.getArticles(_.join(aIds, ',')).then(articles => { 
                this.Articles = _.cloneDeep(articles);
                this.cd.detectChanges();
            });
        }
        // Si la position ne sont pas: Envoyer, Rejeter, Accepter et Terminée
        if (!_.includes([1, 2, 3, 4], parseInt(this.order.position, 10))) {
            // Vérifier si la date de revision est périmé
            _.map(this.Articles, (a) => {
                const dateReview: any = moment(a.date_review);
                const dateNow: any = moment();
                const todayAt6 = moment({
                    year: dateNow.year(),
                    month: dateNow.month(),
                    days: dateNow.date(),
                    hour: 6,
                    minute: 0
                });
                // Si la valeur est 'true', l'article n'est pas à jour
                this.error = dateReview < todayAt6;
            });
            for (const item of <Array<wpItemOrder>>this.Items) {
                // FEATURED: Ajouter une verification avant de voir le devis, 
                // le quantite ajouter par rapport a la quantite disponible
                let currentSupplierVals = item.metaSupplierDataFn;
                if (_.isEmpty(currentSupplierVals)) { 
                    this.error = true; 
                    break; 
                }
                let currentItemArticlesIds: Array<number> = item.articleIdsFn;
                let currentItemArticles: Array<FzProduct> = _.filter(this.Articles, a => _.includes(currentItemArticlesIds, a.id));
                const sumQuantity: number = _.sum(_.map(currentItemArticles, j => parseInt(j.total_sales, 10)));
                const sumTake: number = _.sum(_.map(currentSupplierVals, val => parseInt(val.get, 10)));
                if (sumQuantity < sumTake) this.error = true;
            }
            if (this.error) {
                this.errorOccured('Désolé', "Article en attente ou quantité erronée détecté. Veuillez mettre à jours l'article.", 'warning');
            }
        }
        const CLIENT = await this.getUsers(this.order.customer_id); // Array of user or empty
        this.ownerClient = _.isArray(CLIENT) ? _.clone(CLIENT[0]) : {};
        this.QtItems = _.map(this.Items, item => {
            // Ajouter les articles dans l'objet item
            item.articles = this.Articles;
            // Récuperer tous les meta utiliser pour le produit
            const __supplierVals__ = item.metaSupplierDataFn;
            const allTakeForItem: Array<number> = _.map(__supplierVals__, sp => parseInt(sp.get));
            const takes = _.sum(allTakeForItem);
            // Faire la somme pour tous les nombres d'article ajouter pour chaques fournisseurs
            if (takes === 0 && !item.hasStockRequestFn) {
                this.errorOccured('Désolé', `Fournisseur non definie détecté pour l'article: ${item.name}`, 'error');
                return item;
            }
            // Récuperer le prix le plus grand pour chaque fournisseur ajouter
            // Vérifier le prix et la quantité ajouter
            if (item.quantity > takes && !item.hasStockRequestFn) {
                item.total = item.subtotal = item.price = 0;
                this.errorOccured('Désolé', `Quantité ajouter incorrect. Veuillez vérifier l'article: ${item.name}`, 'error');
                return item;
            }
            return item;
        });

        if (this.error) {
            $('.modal').modal('hide');
            Helpers.setLoading(false);
            // Initialiser la valeur pour le template s'il a une erreur
            this.QtItems = [];
            this.cd.detectChanges();
            return false;
        }
        let allTotalHT: Array<number> = _.map(this.QtItems, o => o.priceFn * o.quantity);
        let allTotalNet: Array<number> = _.map(this.QtItems, item => {
            let total: number = item.subTotalNetFn;
            // Ajouter le frais de transport, si le total vaut moins de XAr*
            return (total < this.minCostWithTransport && total !== 0) ? (this.costTransport + total) : total ;
        });
        this.Billing.totalNet = _.sum(allTotalNet);
        this.Billing.totalHT = _.sum(allTotalHT);
        let priceTax: number = (this.Billing.totalNet * this.Tax) / 100;
        this.Billing.price_tax = priceTax;
        this.Billing.total_tax = parseInt(this.Billing.totalNet) + priceTax;
        this.cd.detectChanges();
        Helpers.setLoading(false);
    }

    ngOnChanges(changes: SimpleChanges): void | boolean {
        if (!_.isUndefined(changes.order.currentValue) && !_.isEmpty(changes.order.currentValue)) {
            // Ajouter l'identifiant de la commande
            this.ID = changes.order.currentValue.id;
            this.Quotation = _.cloneDeep(changes.order.currentValue);
            const lineItems: Array<OrderItem> = this.Quotation.line_items;
            const lineItemsZero: Array<wpItemOrder> = _<Array<OrderItem>>(this.Quotation.line_items_zero).map(item => new wpItemOrder(item) ).value();
            const lineItemsDefault = _<Array<OrderItem>>(lineItems).map(QlItem => new wpItemOrder(QlItem)).value();
            this.Items = _.union(lineItemsDefault, lineItemsZero);
            this.billingAddress = _.clone(this.Quotation.billing);
            this.shippingAddress = _.clone(this.Quotation.shipping);
            return true;
        } 
    }

    /**
     * Récuperer les articles de type 'fz_product'
     * @param ids Array<number>
     */
    getArticles(ids: string): Promise<any> {
        return new Promise(resolve => {
            this.Wordpress.fz_product().include(ids).then(fzProducts => {
                resolve(fzProducts);
            }).catch(err => resolve([]));
        })
    }

    /**
     * Récuperer tous les utilisteurs
     * @param ids Array<number>
     */
    getUsers(ids: string): Promise<any> {
        return new Promise(resolve => {
            this.Wordpress.users().include(ids).context('edit').then(users => {
                resolve(users);
            }).catch(err => { resolve([]); });
        });
    }

    public initQuotation(): void {

    }

}
