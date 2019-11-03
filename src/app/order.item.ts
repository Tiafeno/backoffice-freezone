import { Metadata } from "./metadata";

export class OrderItem {
    id: number;
    meta_data: Array<Metadata>;
    name: string;
    price: number;
    product_id: number;
    quantity: number;
    total: any;
    subtoal: any;
    sku: any;
    variation_id: number;
}