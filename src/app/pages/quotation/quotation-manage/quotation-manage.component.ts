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
import { AuthorizationService } from '../../../_services/authorization.service';
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
     * 3: Terminée
     */
    public quotationPosition: number = 0;
    private items: Array<any> = [];
    private itemId: number = 0;
    private Woocommerce: any;
    private Wordpress: any;
    private allProducts: Array<any> = [];

    public qtSupplierTable: any;
    public objMetaSuppliers: Array<any>;
    public objMetaDiscount: Array<any>;
    public editForm: FormGroup;
    public articleEditor: any;
    public client: any;

    @ViewChild(EditArticleComponent) EditArticle: EditArticleComponent;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private auth: AuthorizationService,
        private apiWC: ApiWoocommerceService,
        private apiWP: ApiWordpressService,
        private services: FzServicesService,
        private zone: NgZone,
        private cd: ChangeDetectorRef
    ) {
        this.Woocommerce = this.apiWC.getWoocommerce();
        this.Wordpress = this.apiWP.getWordpress();
        this.editForm = new FormGroup({
            dFake: new FormControl(''), // Valeur de la remise afficher du côté client
            stockRequest: new FormControl(0), // Forcer la quantité de la demande pour les articles fournisseur disponible
            hasDiscount: new FormControl(true) // Appliquer ou pas la remise pour cette article
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
                let item: any = _.find(this.order.line_items, { id: this.itemId });
                this.item = _.isUndefined(item) || !_.isObject(item) ? null : item;
                // Récuperer la status de la demande
                this.quotationPosition = parseInt(this.order.position, 10);
                // Les meta data
                const meta = this.item.meta_data;
                const fakeDiscount: any = _.find(meta, { key: 'fake_discount' });
                const stockRequest: any = _.find(meta, { key: 'stock_request' });
                const hasDiscount: any = _.find(meta, { key: 'has_discount' });
                this.editForm.patchValue({
                    dFake: _.isUndefined(fakeDiscount) ? 0 : fakeDiscount.value,
                    stockRequest: _.isUndefined(stockRequest) ? 0 : parseInt(stockRequest.value, 10),
                    hasDiscount: _.isUndefined(hasDiscount) ? true : (parseInt(hasDiscount.value, 10) ? true : false)
                });

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
                    .then(users => {
                        const clientRole: string = _.isArray(this.client.roles) ? this.client.roles[0] : this.client.roles;
                        const USERS: Array<any> = _.clone(users);
                        const frmEditValue: any = this.editForm.value;
                        this.qtSupplierTable = $('#quotation-supplier-table').DataTable({
                            // Installer le plugin WP Rest Filter (https://fr.wordpress.org/plugins/wp-rest-filter/)
                            fixedHeader: true,
                            responsive: false,
                            "sDom": 'rtip',
                            data: USERS,
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

                                        let dateLimit: any = moment(pdt.date_review).subtract(-1, 'days');
                                        let msg: string = _.isEqual(this.quotationPosition, 2) || dateLimit > moment() ? "Traité" : "En attente";
                                        let style: string =  _.isEqual(this.quotationPosition, 2) || dateLimit > moment() ? 'blue' : 'warning';

                                        return `<span class="badge badge-${style}">${msg}</span>`;
                                    }
                                }, // statut product
                                {
                                    data: 'id', render: data => {
                                        const userId: any = data;
                                        const pdt: any = _.find(this.allProducts, { user_id: userId });
                                        if (_.isUndefined(pdt)) return 'Introuvable';

                                        const price: number = parseInt(pdt.price, 10);
                                        const marge = clientRole === 'fz-company' ? (pdt.company_status === 'dealer' ? pdt.marge_dealer : pdt.marge) : pdt.marge_particular;
                                        let hisPrice = this.services.getBenefit(price, parseInt(marge, 10));

                                        // Ajouter la remise s'il existe

                                        if (frmEditValue.hasDiscount) {
                                            const discounts: any = _.find(this.item.meta_data, { key: 'discounts' });
                                            const discountValues: Array<any> = _.isUndefined(discounts) ? [] : JSON.parse(discounts.value);
                                            const _current_discount_value = _.isEmpty(discountValues) ? 0 : _.find(discountValues, { article_id: pdt.id }).discount;
                                            hisPrice = hisPrice + parseInt(_current_discount_value);
                                        }

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
                                        /* const metaDiscount: any = _.find(this.item.meta_data, { key: "discount" });
                                        let discount = _.isUndefined(metaDiscount) ? 0 : parseInt(metaDiscount.value, 10); */
                                        if (metaSuppliers && !_.isEmpty(metaSuppliers.value)) {
                                            let dataParser: Array<any> = JSON.parse(metaSuppliers.value); // [{supplier: 450, get: 2, product_id: 0, article_id: 0, price: 0} ...] 
                                            _.map(dataParser, (parse) => {
                                                if (row.id == parse.supplier) {
                                                    inputValue = parseInt(parse.get, 10);
                                                }
                                            });
                                        }

                                        let fzProduct: any = _.find(this.allProducts, { user_id: row.id });

                                        const price: number = parseInt(fzProduct.price, 10);
                                        const marge = clientRole === 'fz-company' ? (fzProduct.company_status === 'dealer' ? fzProduct.marge_dealer : fzProduct.marge) : fzProduct.marge_particular;
                                        let hisPrice: number = this.services.getBenefit(price, parseInt(marge, 10));

                                        // Ajouter la remise s'il existe

                                        if (frmEditValue.hasDiscount) {
                                            const discounts: any = _.find(this.item.meta_data, { key: 'discounts' });
                                            const discountValues: Array<any> = _.isUndefined(discounts) ? [] : JSON.parse(discounts.value);
                                            const _current_discount_value = _.isEmpty(discountValues) ? 0 : _.find(discountValues, { article_id: fzProduct.id }).discount;
                                            hisPrice = hisPrice + parseInt(_current_discount_value);
                                        }

                                        const dateLimit: any = moment(fzProduct.date_review).subtract(-1, 'days');
                                        // vérifier si l'article est en mode rejetée
                                        let disabled: boolean = _.isEqual(this.quotationPosition, 2) ? false : dateLimit <= moment();

                                        return `<input type="number" class="input-increment form-control prd_${fzProduct.id}" 
                                                    value="${disabled ? 0 : inputValue}" 
                                                    min="0" 
                                                    max="${fzProduct.total_sales}" 
                                                    ${disabled ? " disabled='disabled' " : ''}
                                                    data-product="${fzProduct.product_id}" 
                                                    data-supplier="${row.id}" 
                                                    data-price="${hisPrice}" 
                                                    data-article="${fzProduct.id}">`;
                                    }
                                }, // champ quantité
                                {
                                    data: null,
                                    render: (data, type, row) => {
                                        let inputValue: number = 0;
                                        let fzProduct: any = _.find(this.allProducts, { user_id: row.id });
                                        const discount: any = _.find(this.item.meta_data, { key: "discounts" });
                                        if (!_.isUndefined(discount) && !_.isEmpty(discount.value)) {
                                            let dataParser: Array<any> = JSON.parse(discount.value); // [{article_id: 450, discount: 0} ...] 
                                            if (_.isArray(dataParser)) {
                                                inputValue = _.find(dataParser, { article_id: fzProduct.id }).discount;
                                            } else {
                                                Swal.fire('Avertissement', "Enregistrement erroné trouver dans la remise du produit: " + fzProduct.title.rendered, 'warning');
                                            }

                                        }

                                        return `<input type="number" class="input-discount form-control discount_${fzProduct.id}" value="${inputValue}"  min="0" >`;
                                    }
                                } // Champ remise
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
                                 * Ajouter tous les modifications dans les champs dans une variable 'objMetaSuppliers'
                                 */
                                $('#quotation-supplier-table tbody').on('change', '.input-increment', ev => {
                                    ev.preventDefault();

                                    let element = $(ev.currentTarget);
                                    const inputIncrement: any = $(`input.input-increment`);
                                    // stocker dans cette variable les valeurs ajouter pour ce demande d'item
                                    this.objMetaSuppliers = [];
                                    // Vérifier la quantité et la quantité ajouter pour les fournisseurs
                                    const x: Array<number> = _.map(inputIncrement, iI => { return parseInt($(iI).val()); });
                                    this.cd.detectChanges();

                                    let value = $(element).val();
                                    value = parseInt(value, 10);
                                    if (this.item.quantity < _.sum(x)) {
                                        element.val(Math.abs(parseInt(value) - 1));
                                        return false;
                                    };

                                    //TODO: Ajouter la remise dans le prix

                                    _.map(inputIncrement, iI => {
                                        const inputVal = parseInt($(iI).val(), 10);
                                        const inputData: any = $(iI).data();
                                        if (0 !== inputVal) {
                                            this.objMetaSuppliers.push({
                                                get: inputVal,
                                                price: inputData.price,
                                                supplier: parseInt(inputData.supplier, 10),
                                                product_id: parseInt(inputData.product, 10),
                                                article_id: parseInt(inputData.article, 10),
                                            });
                                        }
                                    });

                                    console.log(this.objMetaSuppliers);

                                });

                                $('#quotation-supplier-table tbody').on('change', '.input-discount', ev => {
                                    ev.preventDefault();
                                    const el = $(ev.currentTarget).parents('tr');
                                    const item = this.qtSupplierTable.row(el).data();
                                    const frmEditValue: any = this.editForm.value;

                                    this.objMetaDiscount = [];
                                    $(`input.input-discount`).each((index, value) => {
                                        let discount: number = frmEditValue.hasDiscount ? parseInt($(value).val()) : 0; // en Ariary
                                        let fzProduct: any = _.find(this.allProducts, { user_id: item.id });
                                        this.objMetaDiscount.push({
                                            discount: discount,
                                            price: parseInt(fzProduct.price, 10) + discount,
                                            article_id: parseInt(fzProduct.id, 10),
                                        });
                                    });
                                });


                            }
                        })
                    });

            }, error => {
                Helpers.setLoading(false);
                Swal.fire('Erreur', error, 'error');
            });
    }

    /**
    * Enregistrer le meta data pour les produits dans la commande
    */
    async onSaveQuotationPdt() {
        // rétourner la fonction pour les conditions suivantes
        if (!_.isObject(this.item)) return false;

        let lineItems: Array<any> = this.items;
        let stockInsuffisantCondition: boolean = false;
        const frmEditValue: any = this.editForm.value;

        if (!_.isEmpty(this.objMetaDiscount)) {
            const discountKey: string = 'discounts';
            lineItems = _.map(lineItems, item => {
                // Récuperer seulement l'item en cours de modification
                if (item.product_id !== this.item.product_id) return item;

                // Récuperer les meta data
                let metaData: Array<any> = _.cloneDeep(item.meta_data);
                // Trouver les remises
                let findDiscounts = _.find(metaData, { key: discountKey } as any);
                // Ajouter le prix la plus élevé 
                const prices = _.map(this.objMetaDiscount, mt => parseInt(mt.price, 10));
                item.price = _.max(prices);
                // Récuperer seuelement les données requis
                const metaValue: Array<any> = _.map(this.objMetaDiscount, m => {
                    return _.pick(m, ['discount', 'article_id']);
                });
                if (_.isUndefined(findDiscounts) || _.isNull(findDiscounts)) {
                    // ajouter la remise dans la meta data
                    metaData.push({ key: discountKey, 'value': JSON.stringify(metaValue) });
                } else {
                    // Corriger la valeur des remises dans la meta data
                    metaData = _.map(metaData, meta => {
                        if (meta.key === discountKey) {
                            meta.value = JSON.stringify(metaValue);
                        }
                        return meta;
                    });
                }

                item.meta_data = _.clone(metaData);
                return item;
            });
        }

        if (!_.isEmpty(this.objMetaSuppliers)) {
            // Récuperer la valeur de consition pour le changement de quantité

            let allCollectQuantity: Array<number> = _.map(this.objMetaSuppliers, meta => { return parseInt(meta.get, 10); });
            let collectQts = _.sum(allCollectQuantity);

            if (collectQts < this.item.quantity) {
                const { value: result } = await Swal.fire({
                    title: 'Confirmation',
                    html: `La quantité demander par le client est supérieure au quantité disponible <br> Voulez-vous le remplacer par celle ci : ${collectQts}`,
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Oui',
                    cancelButtonText: 'Annuler',
                    focusConfirm: false,
                });
                stockInsuffisantCondition = result ? true : false;
                if (result) this.editForm.patchValue({stockRequest: collectQts});
                this.cd.detectChanges();
            }

            const quantityItemTakes = _.map(this.objMetaSuppliers, mt => parseInt(mt.get, 10));

            // Vérifier si la remise est définie 
            lineItems = _.map(lineItems, item => {
                // Récuperer seulement l'item en cours de modification
                if (item.product_id !== this.item.product_id) return item;

                let meta_data: Array<any> = _.cloneDeep(item.meta_data); // Product meta
                const prices = _.map(this.objMetaSuppliers, mt => parseInt(mt.price, 10));

                item.price = _.max(prices);
                let stkRequest = stockInsuffisantCondition ? item.quantity : frmEditValue.stockRequest;
                item.quantity = stockInsuffisantCondition ? _.sum(quantityItemTakes) : item.quantity;
                item.total = Math.round(_.max(prices) * item.quantity).toString();
                item.subtotal = Math.round(_.max(prices) * item.quantity).toString();
                meta_data = _.map(meta_data, meta => {
                    switch (meta.key) {
                        case 'status':
                            // L'etat d'une article est toujours traité pour la demande rejeté
                            if (_.isEqual(this.quotationPosition, 2)) {
                                meta.value = 1;
                                return meta;
                            }

                            // Verifier le status par la quantité ajouter
                            if (_.isEmpty(this.objMetaSuppliers)) {
                                meta.value = 0;
                            } else {
                                // vérifier si la quantité ajouter est valide ou pas
                                // Si la quantité ajouter est inferieur à la quantité demander le status est ègale à 0 si le contraire 1
                                meta.value = collectQts < this.item.quantity && !stockInsuffisantCondition ? 0 : 1;
                            }

                            if (!meta.value) return meta;
                            // Verifier si l'article est en review
                            const aIds: Array<any> = _.map(this.objMetaSuppliers, meta => meta.article_id); // Récuperer les identifiant des articles à ajouter
                            const collectFZProducts: Array<any> = _.filter(this.allProducts, fz => { return _.indexOf(aIds, fz.id) >= 0; });
                            const cltResutls: Array<boolean> = _.map(collectFZProducts, prd => {
                                const dateNow: any = moment();
                                let dateLimit: any = moment(prd.date_review).subtract(-1, 'days');

                                return dateLimit > dateNow; // à jour
                            });

                            meta.value = _.indexOf(cltResutls, false) >= 0 ? 0 : 1;
                            break;
                        case 'suppliers':
                                meta.value = JSON.stringify(this.objMetaSuppliers);
                            break;

                        case 'stock_request':
                                meta.value = stkRequest;
                            break;

                        default:
                            break;
                    }
                    return meta;
                });
                const hasSuppliers = _.find(meta_data, { key: 'suppliers' } as any);
                const hasRequest = _.find(meta_data, { key: 'stock_request'} as any);
                if (_.isUndefined(hasSuppliers)) meta_data.push({ key: 'suppliers', value: JSON.stringify(this.objMetaSuppliers) });
                if (_.isUndefined(hasRequest)) meta_data.push({ key: 'stock_request', value:  stkRequest});
                item.meta_data = _.clone(meta_data);

                return item;
            });
        }

        Helpers.setLoading(true);
        const data: any = { line_items: lineItems };
        this.Woocommerce.put(`orders/${this.orderId}`, data, (err, d, res) => {
            Helpers.setLoading(false);
            if (stockInsuffisantCondition) {
                window.location.reload();
            } else {
                this.ngOnInit();
            }
            
        });
    }

    onUpdateFakeDiscount(event: any) {
        event.preventDefault();
        if (_.isEmpty(this.item)) return false;

        if (!this.auth.isAdministrator()) {
            Swal.fire('Désolé', "Vous n'avez pas l'autorisation pour effectuer cette action", "warning");
            return false;
        }

        if (this.editForm.valid && this.editForm.dirty) {
            const Value: any = this.editForm.value;
            let item = _.cloneDeep(this.item);

            const data: any = {
                line_items: _.map(this.items, (__item__) => {
                    if (__item__.id === item.id) {
                        let findFakeDiscount = _.find(item.meta_data, { key: 'fake_discount' });
                        if (_.isUndefined(findFakeDiscount) || _.isNull(findFakeDiscount)) {
                            item.meta_data.push({ key: 'fake_discount', 'value': Value.dFake });
                        } else {
                            item.meta_data = _.map(item.meta_data, data => {
                                if (data.key === 'fake_discount') {
                                    data.value = Value.dFake
                                }
                                return data;
                            });
                        }

                        return item;
                    }

                    return __item__;
                })
            };

            Helpers.setLoading(true);
            this.Woocommerce.put(`orders/${this.orderId}`, data, (err, d, res) => {
                Helpers.setLoading(false);
                this.ngOnInit();
                this.cd.detectChanges();
            });
        }
    }

    onChangehasDiscount(event: any) {
        event.preventDefault();
        const Value: any = this.editForm.value;
        let item = _.cloneDeep(this.item);

        const data: any = {
            line_items: _.map(this.items, (__item__) => {
                if (__item__.id === item.id) {
                    let hasDisc = _.find(item.meta_data, { key: 'has_discount' });
                    if (_.isUndefined(hasDisc) || _.isNull(hasDisc)) {
                        item.meta_data.push({ key: 'has_discount', 'value': Value.hasDiscount ? 1 : 0 });
                    } else {
                        item.meta_data = _.map(item.meta_data, data => {
                            if (data.key === 'has_discount') {
                                data.value = Value.hasDiscount ? 1 : 0
                            }
                            return data;
                        });
                    }

                    return item;
                }

                return __item__;
            })
        };

        Helpers.setLoading(true);
        this.Woocommerce.put(`orders/${this.orderId}`, data, (err, d, res) => {
            Helpers.setLoading(false);
            this.ngOnInit();
            this.cd.detectChanges();
        });

    }

    ngAfterViewInit() {
    }

}
