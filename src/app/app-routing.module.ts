import { NgModule, Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { EditorModule } from '@tinymce/tinymce-angular';

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
import { TagInputModule } from 'ngx-chips';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
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
import { ArticleSupplierComponent } from './pages/supplier/articles/article-supplier/article-supplier.component';
import { ProductListsComponent } from './pages/products/product-lists/product-lists.component';
import { ProductNewComponent } from './pages/products/product-new/product-new.component';
import { FilterArticleComponent } from './components/filter-article/filter-article.component';
import { FilterSearchArticleComponent } from './components/filter-search-article/filter-search-article.component';
import { AddArticleComponent } from './pages/supplier/articles/add-article/add-article.component';
import { FzServicesService } from './_services/fz-services.service';
import { EditArticleComponent } from './pages/supplier/articles/edit-article/edit-article.component';
import { ProductEditComponent } from './pages/products/product-edit/product-edit.component';
import { QuotationViewComponent } from './pages/quotation/quotation-view/quotation-view.component';
import { MomentsPipe } from './pipes/moments.pipe';
import { StatusQuotationSwitcherComponent } from './components/status-quotation-switcher/status-quotation-switcher.component';
import { QuotationArticleReviewComponent } from './pages/quotation/quotation-article-review/quotation-article-review.component';
import { CustomerEditComponent } from './pages/customer/customer-edit/customer-edit.component';
import { QuotationMailComponent } from './pages/quotation/quotation-mail/quotation-mail.component';
import { ReviewArticlesComponent } from './pages/supplier/articles/review-articles/review-articles.component';
import { ReviewSupplierComponent } from './pages/supplier/review-supplier/review-supplier.component';
import { ReviewMailSupplierComponent } from './pages/supplier/review-mail-supplier/review-mail-supplier.component';
import { SavComponent } from './pages/sav/sav/sav.component';
import { ScheduleGuard } from './guards/schedule.guard';
import { ImportArticleComponent } from './components/import-article/import-article.component';
import { ClientsComponent } from './pages/clients/clients.component';
import { EditClientComponent } from './pages/clients/edit-client/edit-client.component';
import { NoCommercialAccessGuard } from './guards/no-commercial-access.guard';
import { FzSecurityService } from './_services/fz-security.service';
import { StatusArticleComponent } from './components/status-article/status-article.component';
import { TypeClientSwitcherComponent } from "./components/type-client-switcher/type-client-switcher.component";
import { FaqPageComponent } from './pages/faq/faq-page/faq-page.component';
import { ResponsibleComponent } from './components/responsible/responsible.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { UserManagerComponent } from './pages/settings/user-manager/user-manager.component';
import { SavEditComponent } from './pages/sav/sav-edit/sav-edit.component';
import { SavMailComponent } from './pages/sav/sav-mail/sav-mail.component';
import { ModuloReviewSuppliersComponent } from './components/modulo-review-suppliers/modulo-review-suppliers.component';
import { EditArticleDescriptionComponent } from './pages/supplier/articles/edit-article-description/edit-article-description.component';
import { ArticlesComponent } from './pages/supplier/articles/articles.component';
import { BenefitPipe } from './pipes/benefit.pipe';
import { ModuloMailTemplateComponent } from './components/modulo-mail-template/modulo-mail-template.component';
import { CarouselComponent } from './pages/carousel/carousel.component';
import { FaqClientComponent } from './pages/faq-client/faq-client.component';
import { FaqClientAddComponent } from './pages/faq-client/faq-client-add/faq-client-add.component';
import { FaqClientEditComponent } from './pages/faq-client/faq-client-edit/faq-client-edit.component';
import { FaqClientsComponent } from './pages/faq-client/faq-clients/faq-clients.component';
import { QuotationCustomComponent } from './pages/quotation/quotation-custom/quotation-custom.component';
import { QuotationRecapComponent } from './pages/quotation/quotation-recap/quotation-recap.component';
import { QuotationManageComponent } from './pages/quotation/quotation-manage/quotation-manage.component';
import { ArticleRemoverDirective } from './directives/article-remover.directive';
import { AcceptedItemSuppliersComponent } from './components/accepted-item-suppliers/accepted-item-suppliers.component';
import { PrestationsComponent } from './pages/prestations/prestations.component';
import { NoTechnicianAccessGuard } from './guards/no-technician-access.guard';
import { GoodDealEditComponent } from './pages/good-deal/good-deal-edit/good-deal-edit.component';
import { GoodDealListsComponent } from './pages/good-deal/good-deal-lists/good-deal-lists.component';
import { ToExcelComponent } from './components/to-excel/to-excel.component';
import { QuoteAddComponent } from './pages/quotation/quote-add/quote-add.component';
import { WpoptionsComponent } from './pages/settings/wpoptions/wpoptions.component';
import { ClientQuoteComponent } from './pages/clients/client-quote/client-quote.component';
import { StatusOrderPipe } from './pipes/status-order.pipe';
import { SavDatatableComponent } from './components/sav-datatable/sav-datatable.component';
import { AttributesArticleComponent } from './components/attributes/module/attributes-article/attributes-article.component';
import { AttributesComponent } from './components/attributes/attributes.component';
import { DataServicesService } from './_services/data-services.service';
import { AnnonceDatatableComponent } from './annonces/annonce-datatable/annonce-datatable.component';
import { AnnonceEditComponent } from './annonces/annonce-edit/annonce-edit.component';

const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    {
        path: '',
        component: LayoutComponent,
        canActivate: [AuthGuard, ScheduleGuard],
        children: [
            {
                path: 'dashboard',
                children: [
                    { path: '', redirectTo: 'quotation', pathMatch: 'full' },
                    {
                        path: '',
                        component: Dashboard7Component,
                        children: [
                            {
                                path: 'quotation',
                                component: QuotationDatatableComponent
                            },
                            {
                                path: 'quotation/:id',
                                canActivate: [NoTechnicianAccessGuard],
                                children: [
                                    { path: '', redirectTo: 'edit', pathMatch: 'full' },
                                    { path: 'edit', component: QuotationEditComponent },
                                    { path: 'recap', canActivate: [NoCommercialAccessGuard], component: QuotationRecapComponent },
                                    { path: 'item/:itemId', component: QuotationManageComponent }
                                ]
                            }

                        ]
                    }
                ]
            },
            {
                path: 'carousel',
                canActivate: [NoCommercialAccessGuard, NoTechnicianAccessGuard],
                component: CarouselComponent
            },
            {
                path: 'prestations',
                canActivate: [NoCommercialAccessGuard, NoTechnicianAccessGuard],
                component: PrestationsComponent
            },
            {
                path: 'faq-client',
                canActivate: [NoCommercialAccessGuard, NoTechnicianAccessGuard],
                component: FaqClientComponent,
                children: [
                    { path: '', redirectTo: 'view', pathMatch: 'full' },
                    { path: 'view', component: FaqClientsComponent },
                    { path: 'add', component: FaqClientAddComponent },
                    {
                        path: ":id",
                        children: [
                            { path: '', redirectTo: 'edit', pathMatch: 'full' },
                            { path: 'edit', component: FaqClientEditComponent },
                        ]
                    }
                ]
            },
            {
                path: 'annonces',
                children: [
                    { path: '', redirectTo: 'datatable', pathMatch: 'full' },
                    { path: 'datatable', component: AnnonceDatatableComponent },
                    {
                        path: ":id",
                        children: [
                            { path: '', redirectTo: 'edit', pathMatch: 'full' },
                            { path: 'edit', component: AnnonceEditComponent },
                        ]
                    }
                ]
            },
            {
                path: 'sav',
                children: [
                    { path: '', redirectTo: 'lists', pathMatch: 'full' },
                    { path: 'lists', component: SavComponent },
                    {
                        path: ':id',
                        children: [
                            { path: '', redirectTo: 'edit', pathMatch: 'full' },
                            { path: 'edit', component: SavEditComponent },
                            {
                                path: 'mail',
                                component: SavMailComponent
                            }
                        ]
                    }
                ]
            },
            {
                path: 'faq',
                component: FaqPageComponent
            },
            {
                path: 'client',
                canActivate: [NoTechnicianAccessGuard],
                children: [
                    { path: '', redirectTo: 'lists', pathMatch: 'full' },
                    { path: 'lists', component: ClientsComponent },
                    {
                        path: ':id',
                        children: [
                            { path: '', redirectTo: 'edit', pathMatch: 'full' },
                            { path: 'edit', component: EditClientComponent }
                        ]
                    },
                ]
            },
            {
                path: 'supplier',
                canActivate: [NoTechnicianAccessGuard, NoCommercialAccessGuard],
                children: [
                    { path: '', redirectTo: 'lists', pathMatch: 'full' },
                    {
                        path: 'lists',
                        component: SupplierDatatableComponent
                    },
                    {
                        path: 'new',
                        component: AddSupplierComponent
                    },
                    {
                        path: 'review',
                        component: ReviewSupplierComponent
                    },
                    {
                        path: 'article/review',
                        component: ReviewArticlesComponent
                    },
                    {
                        path: ':id',
                        children: [
                            { path: '', redirectTo: 'edit', pathMatch: 'full' },
                            { path: 'edit', component: EditSupplierComponent }
                        ]
                    },

                ]
            },
            {
                path: 'articles',
                component: ArticlesComponent,
                children: [
                    { path: '', redirectTo: 'lists', pathMatch: 'full' },
                    { path: 'lists', component: ArticleSupplierComponent },
                    {
                        path: 'edit/:id',
                        canActivate: [NoCommercialAccessGuard],
                        component: EditArticleDescriptionComponent
                    }
                ]
            },
            {
                path: 'settings',
                canActivate: [NoCommercialAccessGuard, NoTechnicianAccessGuard],
                component: SettingsComponent
            },
            {
                path: 'product',
                canActivate: [NoCommercialAccessGuard, NoTechnicianAccessGuard],
                children: [
                    { path: '', redirectTo: 'lists', pathMatch: 'full' },
                    {
                        path: 'lists',
                        component: ProductListsComponent
                    },
                    {
                        path: 'new',
                        component: ProductNewComponent
                    },
                    {
                        path: ':id',
                        children: [
                            { path: '', redirectTo: 'edit', pathMatch: 'full' },
                            { path: 'edit', component: ProductEditComponent }
                        ]
                    }
                ]
            }
        ]
    },
    {
        path: 'login',
        canActivate: [LoginGuard],
        component: LoginComponent
    },
    {
        'path': 'forgot_password',
        canActivate: [LoginGuard],
        'component': ForgotPasswordComponent
    },
    {
        'path': 'error_404',
        'component': Error404Component
    },
    {
        'path': 'error_403',
        'component': Error403Component
    },
    {
        'path': 'error_500',
        'component': Error500Component
    },
    {
        'path': 'maintenance',
        'component': MaintenanceComponent
    },
    {
        'path': '**',
        'redirectTo': 'error_404',
        'pathMatch': 'full'
    },
];

@NgModule({
    declarations: [
        AnnonceDatatableComponent,
        AnnonceEditComponent,
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
        ProductNewComponent,
        FilterArticleComponent,
        FilterSearchArticleComponent,
        AddArticleComponent,
        EditArticleComponent,
        ProductEditComponent,
        QuotationViewComponent,
        StatusQuotationSwitcherComponent,
        QuotationCustomComponent,
        QuotationArticleReviewComponent,
        QuotationRecapComponent,
        CustomerEditComponent,
        QuotationMailComponent,
        QuotationManageComponent,
        ReviewArticlesComponent,
        ReviewSupplierComponent,
        ReviewMailSupplierComponent,
        ImportArticleComponent,
        ClientsComponent,
        ClientQuoteComponent,
        EditClientComponent,
        SavComponent,
        StatusArticleComponent,
        TypeClientSwitcherComponent,
        FaqPageComponent,
        ResponsibleComponent,
        SettingsComponent,
        UserManagerComponent,
        SavEditComponent,
        SavMailComponent,
        SavDatatableComponent,
        ModuloReviewSuppliersComponent,
        ModuloMailTemplateComponent,
        EditArticleDescriptionComponent,
        CarouselComponent,
        ArticlesComponent,
        FaqClientComponent,
        FaqClientAddComponent,
        FaqClientEditComponent,
        FaqClientsComponent,
        AcceptedItemSuppliersComponent,
        PrestationsComponent,
        GoodDealEditComponent,
        GoodDealListsComponent,
        QuoteAddComponent,
        ToExcelComponent,
        WpoptionsComponent,
        AttributesArticleComponent,
        AttributesComponent,
        MomentsPipe,
        BenefitPipe,
        StatusOrderPipe,
        ArticleRemoverDirective
    ],
    imports: [
        CommonModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        ReactiveFormsModule,
        NgSelectModule,
        EditorModule,
        TagInputModule,
        BrowserAnimationsModule,
        RouterModule.forRoot(routes)
    ],
    providers: [
        AuthorizationService,
        ApiWordpressService,
        ApiWoocommerceService,
        FzServicesService,
        DataServicesService,
        AuthGuard,
        LoginGuard,
        ScheduleGuard,
        NoCommercialAccessGuard,
        NoTechnicianAccessGuard,
        FzSecurityService,
        { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptorService, multi: true }
        // { provide: LocationStrategy, useClass: HashLocationStrategy}
    ],
    exports: [
        RouterModule,
    ]
})

export class AppRoutingModule {

}
