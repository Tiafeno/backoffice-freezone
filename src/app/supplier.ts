export class Supplier {
    id: number;
    name?: string;
    company_name: string;
    company_status?: any;
    mail_commercial_cc?: any;
    mail_logistics_cc?: any;
    meta?: Array<any>;
    reference: any;
    send_mail_review_date?: string;
    // ce champ permet de désactiver ou activer un utilisateur
    // ja_disable_user (Plugin: JA_DisableUsers, url: http://jaredatchison.com)
    // valeur disponible: 0: Active, 1: Désactiver
    disable?: number;
    // Ce champ permet de mettre un utilisateur en attente ou publier
    // fz_pending_user. 0: Active, 1: Pending
    pending?: number;
    nif?: any;
    stat?: any;
    rc?: any;
    cif?: any;
}


export class FzProductCSV {
    id: number;
    title: any;
    price: any;
    marge: number;
    marge_dealer: number;
    marge_particular: number;
    price_particular?: any;
    price_dealer?: any;
    price_UF?: any;
    
}

export class FzProduct extends FzProductCSV {
    status: string;
    date_add: string;
    date_review: string;
    total_sales: any; // Quantité disponible
    user_id: number;
    condition: number; // Disponible - 0, Rupture -1, Obsolete - 2, et Commande - 3
    product_id: number;
    product_cat: Array<any>;
    garentee?: any;
    meta: Array<any>;
}