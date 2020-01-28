class Field {
    value: string;
    label: string;
}
export class SAV {
    ID: number;
    date_add: string;
    date_purchase: string; // Date d'achat
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
}