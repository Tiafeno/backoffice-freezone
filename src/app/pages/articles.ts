import { Metadata } from "../metadata";

export class Article {
    id: number;
    content: any;
    title: any;
    type: string;
    date_add: string;
    date: string;
    date_review: string;
    featured_media: number | string;
    garentee: string | number;
    marge: string;
    marge_dealer: string;
    marge_particular: string;
    meta: Array<Metadata>;
    modified: string;
    price: string | number;
    total_sales: string;
    product_cat: Array<number>;
    product_id: number | string;
    product_status: string;
    product_thumbnail: any;
    status: string;
    supplier: any;
    user_id: number | string;
}