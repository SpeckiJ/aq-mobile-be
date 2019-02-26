import { Component } from '@angular/core';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { TranslateService } from '@ngx-translate/core';
import { ViewController, Toggle } from 'ionic-angular';

import { UpdateCheckProvider } from '../../providers/update-check/update-check';

@Component({
  selector: 'update-hint-popover',
  templateUrl: 'update-hint-popover.html'
})
export class UpdateHintPopoverComponent {

  constructor(
    private iab: InAppBrowser,
    private viewCtrl: ViewController,
    private translate: TranslateService,
    private updateCheck: UpdateCheckProvider
  ) { }

  public externalLink() {
    this.iab.create(this.translate.instant('update.hint.popover.link-faq-url'), '_system', 'hidden=yes');
  }

  public dismiss() {
    this.viewCtrl.dismiss();
  }

  public dontShow(toggle: Toggle) {
    this.updateCheck.setDontShowOnStartup(toggle.value);
  }

}