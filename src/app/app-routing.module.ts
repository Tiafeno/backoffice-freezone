import { NgModule, Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LayoutComponent } from './/layouts/layout.component';
import { Dashboard7Component } from './pages/dashboard-7/dashboard-7.component';

import { LoginComponent } from './pages/login/login.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { Error404Component } from './pages/error-404/error-404.component';
import { Error403Component } from './pages/error-403/error-403.component';
import { Error500Component } from './pages/error-500/error-500.component';
import { MaintenanceComponent } from './pages/maintenance/maintenance.component';
import { AuthGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/login.guard';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { AuthorizationService } from './_services/authorization.service';
import { SupplierDatatableComponent } from './pages/supplier/supplier-datatable/supplier-datatable.component';
import { QuotationDatatableComponent } from './pages/quotation/quotation--datatable/quotation--datatable.component';
import { JwtInterceptorService } from './_services/jwt-interceptor.service';
import { NewCustomerComponent } from './components/new-customer/new-customer.component';
import { ApiWordpressService } from './_services/api-wordpress.service';
import { AddSupplierComponent } from './pages/supplier/add-supplier/add-supplier.component';
import { EditSupplierComponent } from './pages/supplier/edit-supplier/edit-supplier.component';
import { ApiWoocommerceService } from './_services/api-woocommerce.service';
import { QuotationEditComponent } from './pages/quotation/quotation-edit/quotation-edit.component';
import { ArticleSupplierComponent } from './pages/supplier/article-supplier/article-supplier.component';
import { ProductListsComponent } from './pages/products/product-lists/product-lists.component';
import { ProductNewComponent } from './pages/products/product-new/product-new.component';


const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    {
        path: "",
        component: LayoutComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: "dashboard",
                children: [
                    { path: "", redirectTo: 'home', pathMatch: 'full' },
                    { 
                        path: '', 
                        component: Dashboard7Component,
                        children: [
                            {
                                path: 'home',
                                component: QuotationDatatableComponent
                            },
                            {
                                path: 'quotation/:id',
                                children: [
                                    { path: "", redirectTo: 'edit', pathMatch: 'full' },
                                    { path: "edit", component: QuotationEditComponent }
                                ]
                            }
                            
                        ]
                    }
                ]
            },
            {
                path: "supplier",
                children: [
                    { path: "", redirectTo: 'lists', pathMatch: "full" },
                    {
                        path: 'lists',
                        component: SupplierDatatableComponent
                    },
                    {
                        path: 'new',
                        component: AddSupplierComponent
                    },
                    {
                        path: 'articles',
                        component: ArticleSupplierComponent
                    },
                    {
                        path: ":id",
                        children: [
                            { path: "", redirectTo: 'edit', pathMatch: 'full' },
                            { path: 'edit', component: EditSupplierComponent }
                        ]
                    },
                ]
            },
            {
                path: "product",
                children: [
                    { path: "", redirectTo: "lists", pathMatch: "full" },
                    {
                        path: 'lists',
                        component: ProductListsComponent
                    },
                    {
                        path: "new",
                        component: ProductNewComponent
                    }
                ]
            }
        ]
    },
    {
        path: "login",
        canActivate: [LoginGuard],
        component: LoginComponent
    },
    {
        "path": "forgot_password",
        canActivate: [LoginGuard],
        "component": ForgotPasswordComponent
    },
    {
        "path": "error_404",
        "component": Error404Component
    },
    {
        "path": "error_403",
        "component": Error403Component
    },
    {
        "path": "error_500",
        "component": Error500Component
    },
    {
        "path": "maintenance",
        "component": MaintenanceComponent
    },
    {
        "path": "**",
        "redirectTo": "error_404",
        "pathMatch": "full"
    },
];

@NgModule({
    declarations: [
        Dashboard7Component,
        LoginComponent,
        ForgotPasswordComponent,
        Error404Component,
        Error403Component,
        Error500Component,
        MaintenanceComponent,
        SupplierDatatableComponent,
        QuotationDatatableComponent,
        QuotationEditComponent,
        NewCustomerComponent,
        AddSupplierComponent,
        EditSupplierComponent,
        ArticleSupplierComponent,
        ProductListsComponent,
        ProductNewComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        HttpClientModule,
        BrowserModule,
        ReactiveFormsModule,
        RouterModule.forRoot(routes)
    ],
    providers: [
        AuthorizationService,
        ApiWordpressService,
        ApiWoocommerceService,
        AuthGuard,
        LoginGuard,
        { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptorService, multi: true },
        // { provide: LocationStrategy, useClass: HashLocationStrategy}
    ],
    exports: [
        RouterModule,
    ]
})

export class AppRoutingModule { }
