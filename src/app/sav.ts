class Field {
    value: string;
    label: string;
}
export class SAV {
    ID: number;
    date_add: string;
    date_purchase: string; // Date d'achat
    date_release?: string;
    date_handling?: string;
    date_receipt?: string;
    date_diagnostic_end?: string;
    guarentee_product: Field; // garantie ou non
    status_sav: Field;
    product_provider: Field
    client: Field;
    product: string; // Nom du produit
    mark: string;
    serial_number: string;
    description: string;
    approximate_time: string;
    bill: string; // Facture d'achat
    reference?: string;
    garentee: string | number;
    customer?: any;
    accessorie: string;
    other_accessories_desc: string;
}