import { Component } from '@angular/core';
import { ModalController, ViewController } from 'ionic-angular';

import { FAQPage } from '../../pages/faq/faq';

@Component({
  selector: 'update-hint-popover',
  templateUrl: 'update-hint-popover.html'
})
export class UpdateHintPopoverComponent {

  constructor(
    private viewCtrl: ViewController,
    private modalCtrl: ModalController
  ) {
  }
  public navigateFAQ() {
    this.modalCtrl.create(FAQPage).present();
  }
  public dismiss() {
    this.viewCtrl.dismiss();
  }
}
