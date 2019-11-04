import { Component, OnInit, Input, OnChanges, SimpleChanges, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import * as _ from 'lodash';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import { Helpers } from '../../../helpers';
import Swal, { SweetAlertType } from 'sweetalert2';
import * as moment from 'moment';
import { FzServicesService } from '../../../_services/fz-services.service';
import { Metadata } from '../../../metadata';
declare var $: any;

@Component({
    selector: 'app-quotation-view',
    templateUrl: './quotation-view.component.html',
    styleUrls: ['./quotation-view.component.css']
})
export class QuotationViewComponent implements OnInit, OnChanges, AfterViewInit {
    public ID: number = 0;
    public Quotation: any = {};
    private Items: Array<any> = [];
    public QtItems: Array<any> = [];
    public querySupplierProducts: Array<any> = [];
    public Billing: any = {};
    public billingAdress: any = {}; // adresse de facturation
    public shippingAdress: any = {}; // adresse de facturation
    public ownerClient: any = {};

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
            });
    }

    public onSendMail(): void | boolean {
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

        this.QtItems = _.map(this.QtItems, item => {
            // Mettre le prix unitaire pour 0 par default
            // (Le prix sera regenerer automatiquement par woocommerce)
            item.price = '0';
            return item;
        });
        let data: any = {
            currency: 'MGA',
            line_items: this.QtItems
        };
        Helpers.setLoading(true);
        $('.modal').modal('hide');
        this.Woocommerce.put(`orders/${this.ID}`, data, (err, data, res) => {
            Helpers.setLoading(false);
            // Afficher la boite de dialogue pour l'envoie de mail
            $('#quotation-mail-modal').modal('show');
        });
    }

    public errorOccured(title: string, message: string, code: SweetAlertType) {
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

        let aIds: Array<any> = this.getMetabyProperty('article_id');
        const ARTICLES = await this.getArticles(_.join(aIds, ',')); // Array of fz_product type
        // Si la position ne sont pas: Envoyer, Rejeter, Accepter et Terminée
        if (!_.includes([1, 2, 3, 4], parseInt(this.order.position, 10))) {
            // Vérifier si la date de revision est périmé
            _.map(ARTICLES, (a) => {
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

            if (this.error) {
                $('.modal').modal('hide');
                Helpers.setLoading(false);
                this.cd.detectChanges();
                setTimeout(() => {
                    Swal.fire('Désolé', "Article en attente détecté. Veuillez mettre à jours l'article", 'error');
                }, 600);

                return false;
            }
        }

        const CLIENT = await this.getUsers(this.order.customer_id); // Array of user or empty
        this.ownerClient = _.isArray(CLIENT) ? _.clone(CLIENT[0]) : {};

        this.QtItems = _.map(this.Items, item => {
            // Récuperer tous les meta utiliser pour le produit
            const meta_data: Array<Metadata> = _.cloneDeep(item.meta_data);
            const dataSuppliers: any = _.find(meta_data, { key: 'suppliers' });
            if (_.isUndefined(dataSuppliers)) { return item; }
            const __supplierVals__ = JSON.parse(dataSuppliers.value);
            const allTakeForItem: Array<number> = _.map(__supplierVals__, sp => parseInt(sp.get));

            /**
             * 0: Aucun
             * 1: Remise
             * 2: Rajout
             */
            const discountTypeFn = (): number => {
                let type = _.find(meta_data, { key: 'discount_type' });
                if (_.isUndefined(type)) return 0;
                return _.isNaN(parseInt(type.value)) ? 0 : parseInt(type.value);
            };

            const hasStockRequest = (): boolean => {
                let stockR = _.find(meta_data, { key: 'stock_request' });
                if (_.isUndefined(stockR)) return false;
                return _.isEqual( parseInt(stockR.value, 10), 0) ? false : true;
            };


            // Faire la somme pour tous les nombres d'article ajouter pour chaques fournisseurs
            const takes = _.sum(allTakeForItem);
            if (takes === 0 && !hasStockRequest()) {
                this.errorOccured('Désolé', `Fournisseur non definie détecté pour l'article: ${item.name}`, 'error');
                return item;
            }
            // Récuperer le prix le plus grand pour chaque fournisseur ajouter
            // Vérifier le prix et la quantité ajouter
            if (item.quantity > takes && !hasStockRequest()) {
                item.stock = item.total = item.subtotal = item.price = 0;
                this.errorOccured('Désolé', `Quantité ajouter incorrect. Veuillez vérifier l'article: ${item.name}`, 'error');
                return item;
            }

            
            item.discountTypeFn = (): number => {
                return discountTypeFn();
            };

            item.discountFn = (): number => {
                let discount: any = _.find(meta_data, { key: 'discount' });
                if (_.isUndefined(discount) || _.isNaN(parseInt(discount.value)) || parseInt(discount.value) === 0) return 0;
                return parseInt(discount.value);
            };

            const discountPercentFn = (): number => {
                return (item.price * item.discountFn()) / 100;
            };

            item.priceFn = () => {
                switch (discountTypeFn()) {
                    case 2: // Rajout
                        return item.price + discountPercentFn();
                    case 1: // Remise & Aucun
                    default:
                        return item.price;
                }
            };

            item.subTotalNetFn = (): number => {
                switch (discountTypeFn()) {
                    case 2:
                        return item.quantity * (item.price - discountPercentFn());
                    case 1:
                        return (item.price - discountPercentFn()) * item.quantity;
                    case 0:
                    default:
                        return item.quantity * item.price;

                }
            }

            return item;
        });

        let allTotalHT: Array<number> = _.map(this.QtItems, item => item.priceFn() * item.quantity);
        this.Billing.totalHT = _.sum(allTotalHT);
        let allTotalNet: Array<number> = _.map(this.QtItems, item => item.subTotalNetFn());
        this.Billing.totalNet = _.sum(allTotalNet);

        let priceTax: number = (this.Billing.totalNet * this.Tax) / 100;
        this.Billing.price_tax = priceTax;
        this.Billing.total_tax = parseInt(this.Billing.totalNet) + priceTax;

        this.cd.detectChanges();
        Helpers.setLoading(false);
    }

    ngOnChanges(changes: SimpleChanges): void | boolean {
        if (!_.isUndefined(changes.order.currentValue) && !_.isEmpty(changes.order.currentValue)) {
            this.ID = changes.order.currentValue.id;
            this.Quotation = _.cloneDeep(changes.order.currentValue);
            this.Items = _.cloneDeep(this.Quotation.line_items);
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
    private getMetabyProperty(property: string): Array<any> {
        return _.map(this.Items, item => {
            let metas = item.meta_data;
            let supplier: any = _.find(metas, { key: 'suppliers' });
            if (_.isUndefined(supplier)) return [];
            // récuperer la valeur du meta item
            let Value = !_.isEmpty(supplier.value) ? JSON.parse(supplier.value) : [];
            // Récupere seulement la propriété définie
            return _.map(Value, data => data[property]);
        });
    }


    public initQuotation(): void {

    }

}
