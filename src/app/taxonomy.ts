export class Taxonomy {
    term_id: number;
    name: string;
    slug?: string;
    term_group?: number;
    term_taxonomy_id?: number;
    taxonomy?: string;
    description?: string;
    parent: number;
    count?: 7;
    filter?: string;
};

export class TermAttribute {
    id: number;
    name: string;
    slug: string;
    has_archives: boolean;
    order_by: string;
}
