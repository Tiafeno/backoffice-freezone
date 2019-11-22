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