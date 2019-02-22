import { Component } from '@angular/core';
import { NavController, ViewController } from 'ionic-angular';


import { FAQPage } from '../../pages/faq/faq';

@Component({
  selector: 'update-hint-popover',
  templateUrl: 'update-hint-popover.html'
})
export class UpdateHintPopoverComponent {

  constructor(
    private nav: NavController,
    private viewCtrl: ViewController
  ) {
  }
  public navigateFAQ() {
    this.nav.push(FAQPage);
  }
  public dismiss() {
    this.viewCtrl.dismiss();
  }
}
