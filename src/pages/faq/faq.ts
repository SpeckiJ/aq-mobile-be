import { Component } from '@angular/core';
import { Language, SettingsService } from '@helgoland/core';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { TranslateService } from '@ngx-translate/core';

import { MobileSettings } from '../../providers/settings/settings';
import { ViewController } from 'ionic-angular';

@Component({
  selector: 'page-faq',
  templateUrl: 'faq.html',
})
export class FAQPage {

  public name = 'faq';
  public languageList: Language[];

  constructor(
    private iab: InAppBrowser,
    private translate: TranslateService,
    private faq: SettingsService<MobileSettings>,
    private viewCtrl: ViewController
  ) {
    this.languageList = this.faq.getSettings().languages;
  }

  public showMoreInfoCalculatedHow() {
    this.iab.create(this.translate.instant('faq.calculatedHow.link'), '_system', 'hidden=yes');
  }

  public showMoreInfoAccuracy() {
    this.iab.create(this.translate.instant('faq.accuracy.link'), '_system', 'hidden=yes');
  }

  public showMoreInfoCompareCurieuzeneuzen() {
    this.iab.create(this.translate.instant('faq.compareCurieuzeneuzen.link'), '_system', 'hidden=yes');
  }

  public dismiss() {
    this.viewCtrl.dismiss();
  }
}
