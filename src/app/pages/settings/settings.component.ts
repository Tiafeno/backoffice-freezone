import { Component, OnInit, ViewChild } from '@angular/core';
import { UserManagerComponent } from './user-manager/user-manager.component';
import { WpoptionsComponent } from './wpoptions/wpoptions.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  @ViewChild(UserManagerComponent) public manager: UserManagerComponent;
  @ViewChild(WpoptionsComponent) public wpoptions: WpoptionsComponent;
  constructor() { }

  ngOnInit() {
  }

}
