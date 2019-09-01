import { Component, OnInit, ViewChild } from '@angular/core';
import { UserManagerComponent } from '../../components/user-manager/user-manager.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  @ViewChild(UserManagerComponent) public manager: UserManagerComponent;
  constructor() { }

  ngOnInit() {
  }

}
