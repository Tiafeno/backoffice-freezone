import { Taxonomy } from "./taxonomy";

export interface WPGoodDeal {
    ID: number;
    post_title: string;
    post_content: string;
    post_date: string;
    post_status: string;
    price: string;
    gallery: any[];
    post_author_annonce: any;
    categorie: any[];
    meta: any
}

export interface NodeGoodDeal {
    id: number;
    status: string;
    title: { rendered: string };
    content: { rendered: string, protected: boolean };
    type: string;
    slug: string;
    date: string;
    date_gmt: string;
    meta: { gd_price: number, gd_author: number };
    product_cat: number[];
    categorie: Taxonomy[];
    gallery_thumbnals: Array<{ id: number, src: string }>;
    featured_media: number;
}