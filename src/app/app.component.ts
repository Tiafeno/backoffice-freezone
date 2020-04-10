import { Component, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { Helpers } from "./helpers";
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

@Component({
    selector: 'body',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    encapsulation: ViewEncapsulation.None,
})

export class AppComponent implements OnInit, AfterViewInit {
    title = 'app';
    constructor(private _router: Router) { }

    ngOnInit() {
        this._router.events.subscribe((route) => {
            if (route instanceof NavigationStart) {
                Helpers.setLoading(true);
            }
            if (route instanceof NavigationEnd) {
                window.scrollTo(0, 0);
                Helpers.setLoading(false);
                // Initialize page: handlers ...
                Helpers.initPage();
            }
        });
        registerLocaleData(localeFr, 'fr');
    }
    ngAfterViewInit() { }
}
