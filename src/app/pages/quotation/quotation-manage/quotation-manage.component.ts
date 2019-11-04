import { Component, OnInit, AfterViewInit, ChangeDetectorRef, NgZone, ViewChild } from '@angular/core';
import { Helpers } from '../../../helpers';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import * as _ from 'lodash';
import * as moment from 'moment';
import Swal from 'sweetalert2';
import { FzServicesService } from '../../../_services/fz-services.service';
import { EditArticleComponent } from '../../supplier/articles/edit-article/edit-article.component';
import { FormGroup, FormControl } from '@angular/forms';
import { Metadata } from '../../../metadata';
declare var $: any;

@Component({
    selector: 'app-quotation-manage',
    templateUrl: './quotation-manage.component.html',
    styleUrls: ['./quotation-manage.component.css']
})
export class QuotationManageComponent implements OnInit, AfterViewInit {
    public orderId: number = 0;
    public order: any = {};
    public item: any;
    /**
     * 0: En attente
     * 1: Envoyer
     * 2: Rejetés
     * 3: Accepter
     * 4: Terminée
     */
    public quotationPosition: number = 0;
    private items: Array<any> = [];
    private itemId: number = 0;
    private Woocommerce: any;
    private Wordpress: any;
    private allProducts: Array<any> = [];

    public qtSupplierTable: any;
    public qtyIncrement: Array<any>;
    public editForm: FormGroup;
    public articleEditor: any;
    public client: any;

    @ViewChild(EditArticleComponent) EditArticle: EditArticleComponent;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private apiWC: ApiWoocommerceService,
        private apiWP: ApiWordpressService,
        private services: FzServicesService,
        private zone: NgZone,
        private cd: ChangeDetectorRef
    ) {
        this.Woocommerce = this.apiWC.getWoocommerce();
        this.Wordpress = this.apiWP.getWordpress();
        this.editForm = new FormGroup({
            stock_request: new FormControl(0), // Forcer la quantité de la demande pour les articles fournisseur disponible
            discount: new FormControl({ value: 0, disabled: false }), // Forcer la quantité de la demande pour les articles fournisseur disponible
            discount_type: new FormControl('0') // Appliquer ou pas la remise pour cette article
        });
    }

    public refreshTable() {
        Helpers.setLoading(true);
        this.onRenderTable();
    }

    ngOnInit() {
        Helpers.setLoading(true);
        this.route.params.subscribe(params => {
            this.orderId = parseInt(params.id, 10);
            this.itemId = parseInt(params.itemId, 10);
            // Récuperer la demande pour la modification
            this.Woocommerce.get(`orders/${this.orderId}`, async (err, data, res) => {
                this.order = JSON.parse(res);
                // Récuperer l'item dans la demande
                this.items = _.cloneDeep(this.order.line_items);
                // Récuperer l'item en cours
                let item: any = _.find(this.order.line_items, { id: this.itemId });
                this.item = _.isUndefined(item) || !_.isObjectLike(item) ? null : item;
                // Récuperer la status de la demande
                this.quotationPosition = parseInt(this.order.position, 10);
                // Les meta data
                const meta = this.item.meta_data;
                const discount: any = _.find(meta, { key: 'discount' });
                const discountType: any = _.find(meta, { key: 'discount_type' });
                const stockRequest: any = _.find(meta, { key: 'stock_request' });

                this.editForm.patchValue({
                    discount: _.isUndefined(discount) ? 0 : parseInt(discount.value),
                    stock_request: _.isUndefined(stockRequest) ? 0 : parseInt(stockRequest.value, 10),
                    discount_type: _.isUndefined(discountType) ? '0' : discountType.value
                });

                this.isRegulatoryAuditDisabled();

                // Récupérer l'utilisateur (client) qui a fait la demande
                await this.Wordpress
                    .users()
                    .id(this.order.user_id)
                    .context('edit')
                    .then(user => { this.client = _.clone(user); });

                // Afficher les informations sur la table
                this.onRenderTable();
                this.cd.detectChanges();
            });
        });
    }

    onRenderTable() {
        if ($.fn.dataTable.isDataTable('#quotation-supplier-table')) {
            this.qtSupplierTable.destroy();
        }

        this.Wordpress
            .fz_product()
            .context('edit')
            .param('meta_key', "product_id")
            .param('meta_value', this.item.product_id)
            .then(response => {
                let products: Array<any> = _.clone(response);
                this.allProducts = _.cloneDeep(products);// Collect tous les articles pour ce produit
                // Vérfier si la liste des fournisseur disponible pour l'article est vide
                if (_.isEmpty(products)) {
                    Swal.fire('Désolé', "Aucun fournisseur ne posséde cette article ou qu'il est encore en attente.", "warning");
                    Helpers.setLoading(false);
                    return false;
                }
                this.cd.detectChanges();
                // Récuperer les fournisseurs (utilisateur) qui possède cette article
                let supplier_ids: Array<number> = _.map(this.allProducts, p => parseInt(p.user_id, 10));
                this.Wordpress
                    .users()
                    .include(_.join(supplier_ids, ','))
                    .roles('fz-supplier')
                    .context('edit')
                    .then(respSuppliers => {
                        const clientRole: string = _.isArray(this.client.roles) ? this.client.roles[0] : this.client.roles;
                        const SUPPLIERS: Array<any> = _.clone(respSuppliers);
                        const dateNow = moment();
                        const todayAt6 = moment({
                            year: dateNow.year(),
                            month: dateNow.month(),
                            days: dateNow.date(),
                            hour: 6,
                            minute: 0
                        });
                        this.qtSupplierTable = $('#quotation-supplier-table').DataTable({
                            // Installer le plugin WP Rest Filter (https://fr.wordpress.org/plugins/wp-rest-filter/)
                            fixedHeader: true,
                            responsive: false,
                            "sDom": 'rtip',
                            data: SUPPLIERS, // Fournisseurs
                            columns: [
                                {
                                    data: 'company_name', render: (data, type, row) => {
                                        return `<span>${data}</span>`
                                    }
                                },
                                {
                                    data: 'reference', render: (data, type, row) => {
                                        return `<span class="badge badge-default view-supplier" style="cursor: pointer" data-supplier="${row.id}">${data}</span>`
                                    }
                                },
                                {
                                    data: 'id', render: (data, type, row) => { // stock
                                        let userId: any = data;
                                        let pdt: any = _.find(this.allProducts, { user_id: userId });
                                        return pdt.total_sales;
                                    }
                                }, // Quantité
                                {
                                    data: 'id', render: (data) => {
                                        let userId: any = data;
                                        let pdt: any = _.find(this.allProducts, { user_id: userId });
                                        if (_.isUndefined(pdt)) return 'Introuvable';
                                        const dateReview = moment(pdt.date_review);
                                        let msg: string = _.isEqual(this.quotationPosition, 2) || dateReview > todayAt6 ? "Traité" : "En attente";
                                        let style: string = _.isEqual(this.quotationPosition, 2) || dateReview > todayAt6 ? 'blue' : 'warning';
                                        return `<span class="badge badge-${style}">${msg}</span>`;
                                    }
                                }, // statut product
                                {
                                    data: 'id', render: data => {
                                        const userId: any = data;
                                        const pdt: any = _.find(this.allProducts, { user_id: userId });
                                        if (_.isUndefined(pdt)) return 'Introuvable';

                                        const price: number = parseInt(pdt.price, 10);
                                        const marge = clientRole === 'fz-company' ? (this.client.company_status === 'dealer' ? pdt.marge_dealer : pdt.marge) : pdt.marge_particular;
                                        let hisPrice = this.services.getBenefit(price, parseInt(marge, 10));

                                        return this.services.currencyFormat(hisPrice);
                                    }
                                }, // price product
                                {
                                    data: 'id', render: data => {
                                        let userId: any = data;
                                        let pdt: any = _.find(this.allProducts, { user_id: userId });
                                        let article: any = JSON.stringify(pdt);
                                        return `<span class='badge badge-success view-article' style='cursor: pointer' data-article='${article}'>VOIR</span>`;
                                    }
                                }, // voir ou modifier le produit
                                {
                                    data: null, render: (data, type, row) => {
                                        let inputValue: number = 0;
                                        const metaSuppliers: any = _.find(this.item.meta_data, { key: "suppliers" });
                                        if (_.isObjectLike(metaSuppliers) && !_.isEmpty(metaSuppliers.value)) {
                                            let dataParser: Array<any> = JSON.parse(metaSuppliers.value); // [{supplier: 450, get: 2, product_id: 0, article_id: 0, price: 0} ...] 
                                            let input: Array<any> = _.map(dataParser, data => {
                                                return row.id == data.supplier ? parseInt(data.get, 10) : 0;
                                            });
                                            inputValue = _.sum(input);
                                        }

                                        let fzProduct: any = _.find(this.allProducts, { user_id: row.id });
                                        const dateReview = moment(fzProduct.date_review);
                                        // vérifier si l'article est en mode rejetée
                                        let disabled: boolean = _.isEqual(this.quotationPosition, 2) ? false : dateReview < todayAt6;

                                        return `<input type="number" class="input-increment form-control prd_${fzProduct.id}" 
                                                    value="${inputValue}" 
                                                    min="0" 
                                                    max="${fzProduct.total_sales}" 
                                                    ${disabled ? " disabled='disabled' " : ''}
                                                    data-product="${fzProduct.product_id}" 
                                                    data-supplier="${row.id}" 
                                                    data-article="${fzProduct.id}">`;
                                    }
                                }, // champ quantité
                            ],
                            initComplete: () => {
                                Helpers.setLoading(false);
                                this.cd.detectChanges();

                                $('#quotation-supplier-table tbody').on('click', '.view-supplier', ev => {
                                    ev.preventDefault();
                                    const element = $(ev.currentTarget);
                                    const elData: any = $(element).data();
                                    $('.modal').modal('hide');
                                    setTimeout(() => {
                                        this.zone.run(() => this.router.navigate(['/supplier', elData.supplier, 'edit']));
                                    }, 600);
                                });

                                $('#quotation-supplier-table tbody').on('click', '.view-article', ev => {
                                    ev.preventDefault();
                                    let data: any = $(ev.currentTarget).data();
                                    this.articleEditor = _.clone(data.article);
                                    this.cd.detectChanges();
                                });

                                /**
                                 * Ajouter tous les modifications dans les champs dans une variable 'qtyIncrement'
                                 */
                                $('#quotation-supplier-table tbody').on('change', '.input-increment', ev => {
                                    ev.preventDefault();

                                    let element = $(ev.currentTarget);
                                    const inputIncrement: any = $(`input.input-increment`);
                                    // Vérifier la quantité et la quantité ajouter pour les fournisseurs
                                    const allValue: Array<number> = _.map(inputIncrement, iI => { return parseInt($(iI).val()); });
                                    if (this.item.quantity < _.sum(allValue)) {
                                        let value = parseInt($(element).val(), 10);
                                        element.val(Math.abs(value - 1));
                                        return false;
                                    };

                                });
                            }
                        })
                    });

            }, error => {
                Helpers.setLoading(false);
                Swal.fire('Erreur', error, 'error');
            });
    }

    public isRegulatoryAuditDisabled() {
        let discountType: any = this.editForm.get('discount_type').value;
        discountType = parseInt(discountType);
        if (_.isEqual(discountType, 0)) {
            this.editForm.get('discount').disable();
        } else {
            this.editForm.get('discount').enable();
        }
    }   

    /**
    * Enregistrer le meta data pour les produits dans la commande
    */
    async onSaveQuotationPdt() {
        // rétourner la fonction pour les conditions suivantes
        if (!_.isObjectLike(this.item)) return false;
        // stocker dans cette variable les valeurs ajouter pour ce demande d'item
        this.qtyIncrement = [];
        let lineItems: Array<any> = this.items;
        let stockInsuffisantCondition: boolean = false;
        const frmEditValue: any = this.editForm.value;
        // Tous les champs d'ajout de quantity ajouté
        const inputIncrement: any = $(`input.input-increment`);
        // Récuperer tous les valeurs d'entrée pour la quantity ajouter
        _.map(inputIncrement, iI => {
            const inputVal = parseInt($(iI).val(), 10);
            const inputData: any = $(iI).data();
            if (!_.isEqual(inputVal, 0)) {
                this.qtyIncrement.push({
                    get: inputVal,
                    supplier: parseInt(inputData.supplier, 10),
                    product_id: parseInt(inputData.product, 10),
                    article_id: parseInt(inputData.article, 10),
                });
            }
        });
        // Mettre à jours les fournisseurs ajouter pour l'article
        // Récuperer la valeur de consition pour le changement de quantité

        let allCollectQuantity: Array<number> = _.map(this.qtyIncrement, meta => { return parseInt(meta.get, 10); });
        let collectQts = _.sum(allCollectQuantity);

        if (collectQts < this.item.quantity) {
            const { value: dialogResult } = await Swal.fire({
                title: 'Confirmation',
                html: `La quantité demander par le client est supérieure au quantité disponible <br> Voulez-vous le remplacer par celle ci : ${collectQts}`,
                type: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Oui',
                cancelButtonText: 'Non',
                allowOutsideClick: false,
                focusConfirm: false,
            });
            stockInsuffisantCondition = dialogResult ? true : false;
            if (dialogResult) this.editForm.patchValue({ stock_request: collectQts });
            this.cd.detectChanges();
        }

        const quantityItemTakes = _.map(this.qtyIncrement, mt => parseInt(mt.get, 10));

        // Vérifier si la remise est définie 
        lineItems = _.map(lineItems, item => {
            // Récuperer seulement l'item en cours de modification
            if (item.product_id !== this.item.product_id) return item;

            let meta_data: Array<Metadata> = _.cloneDeep(item.meta_data);
            let stkRequest = stockInsuffisantCondition ? item.quantity : frmEditValue.stock_request;

            // Redefinir la quantité du produit
            item.quantity = stockInsuffisantCondition ? _.sum(quantityItemTakes) : item.quantity;

            /******************* MISE A JOUR DES METADATA ************************/
            meta_data = _.map(meta_data, meta => {
                switch (meta.key) {
                    case 'status':
                        // Ajouter une posibilité de modification les demandes rejetée
                        if (_.isEqual(this.quotationPosition, 2)) {
                            meta.value = 1;
                            return meta;
                        }

                        // Verifier le status par la quantité ajouter
                        // vérifier si la quantité ajouter est valide ou pas
                        // Si la quantité ajouter est inferieur à la quantité demander le status est ègale à 0 si le contraire 1
                        meta.value = (collectQts < this.item.quantity && !stockInsuffisantCondition) ? 0 : 1;
                        if (!meta.value) return meta;
                        // Verifier si l'article est en review
                        const aIds: Array<any> = _.map(this.qtyIncrement, meta => meta.article_id); // Récuperer les identifiant des articles à ajouter
                        const collectFZProducts: Array<any> = _.filter(this.allProducts, fz => { return _.indexOf(aIds, fz.id) >= 0; });
                        const dateNow: any = moment();
                        const todayAt6 = moment({
                            year: dateNow.year(),
                            month: dateNow.month(),
                            days: dateNow.date(),
                            hour: 6,
                            minute: 0
                        });
                        const cltResutls: Array<boolean> = _.map(collectFZProducts, prd => {
                            let dateLimit: any = moment(prd.date_review);
                            return dateLimit > todayAt6; // à jour
                        });

                        meta.value = _.indexOf(cltResutls, false) >= 0 ? 0 : 1;
                        break;

                    default:
                        break;
                }
                return meta;
            });
            /************************************************************************* */

            meta_data = _.reject(meta_data, { key: 'stock_request' });
            meta_data.push({ key: 'stock_request', value: stkRequest });

            // Meta data informations
            const supValues: Array<any> = _.map(this.qtyIncrement, m => {
                return _.pick(m, ['get', 'supplier', 'product_id', 'article_id']);
            });
            meta_data = _.reject(meta_data, { key: 'suppliers' });
            meta_data.push({ key: 'suppliers', value: JSON.stringify(supValues) });

            item.meta_data = _.clone(meta_data);

            return item;
        });

        lineItems = _.map(lineItems, item => {
            if (item.id !== this.itemId) return item;

            const formValue = this.editForm.value;
            let meta_data: Array<Metadata> = _.cloneDeep(item.meta_data);

            meta_data = _.reject(meta_data, { key: 'discount' });
            meta_data.push({ key: 'discount', value: parseInt(formValue.discount, 10) });

            meta_data = _.reject(meta_data, { key: 'discount_type' });
            meta_data.push({ key: 'discount_type', value: parseInt(formValue.discount_type, 10) });

            item.meta_data = meta_data;
            return item;
        });

        /***************** PRIX ***********/
        const clientRole: string = _.isArray(this.client.roles) ? this.client.roles[0] : this.client.roles;
        lineItems = _.map(lineItems, item => {
            // Seulemet l'item actuellement en cours de modification
            if (item.id !== this.itemId) return item;

            let suppliers: any = _.find(item.meta_data, { key: 'suppliers' });
            if (_.isUndefined(suppliers)) return item;
            let suppliersValue: Array<any> = _.isObjectLike(suppliers) ? JSON.parse(suppliers.value) : [];
            if (_.isEmpty(suppliersValue)) return item;

            let pdtPrices: Array<number> = _.map(suppliersValue, sup => {
                let fzProduct: any = _.find(this.allProducts, { id: sup.article_id });
                if (_.isUndefined(fzProduct)) return 0;
                const price: number = parseInt(fzProduct.price, 10);
                const marge = clientRole === 'fz-company' ? (this.client.company_status === 'dealer' ? fzProduct.marge_dealer : fzProduct.marge) : fzProduct.marge_particular;
                let hisPrice: number = this.services.getBenefit(price, parseInt(marge, 10));

                return hisPrice;
            });

            let price: number = _.max(pdtPrices);
            item.price = price.toString();
            item.total = Math.round(price * item.quantity).toString();
            item.subtotal = Math.round(price * item.quantity).toString();

            return item;
        });
        /******************************* */

        Helpers.setLoading(true);
        const data: any = { line_items: lineItems };

        this.Woocommerce.put(`orders/${this.orderId}`, data, (err, d, res) => {
            this.qtyIncrement = [];
            Helpers.setLoading(false);
            this.zone.run(() => { this.router.navigate(['/dashboard', 'quotation', this.orderId]) });
        });
    }

    ngAfterViewInit() {
    }

}
