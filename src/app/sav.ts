class Field {
    value: string;
    label: string;
}

class renderedbject {
    rendered: string;
    protected?: boolean;
}

// SAV interface for freezone object
export interface SAV {
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
    meta?: any;
}

export interface WPSAV {
    id: number;
    date: string;
    date_gmt: string;
    guid: any;
    modified: string;
    modified_gmt: string;
    slug: string;
    status: string;
    type: string;
    link: string;
    title: renderedbject;
    content: renderedbject;
    excerpt: renderedbject;
    featured_media: number;
    template: string;
    meta: {has_edit: boolean, editor_accessorie: any, editor_other_accessorie_desc: any, editor_breakdown: any};
    product: string;
    mark: string | null;
    guarentee_product: Field;
    garentee: string;
    product_provider: Field;
    date_purchase: string | null;
    date_receipt: string | null;
    date_release: string | null;
    date_handling: string | null;
    date_diagnostic_end: string | null;
    bill: string | null;
    serial_number: number;
    description: string;
    status_sav: number | null;
    quotation_ref: string | null;
    reference: string;
    accessorie: any[];
    other_accessories_desc: string;
    customer: any;
}