import { Component } from '@angular/core';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'annual-mean-panel-information-popup',
  templateUrl: 'annual-mean-panel-information-popup.html'
})
export class AnnualMeanPanelInformationPopupComponent {

  constructor(
    private iab: InAppBrowser,
    private translate: TranslateService
  ) { }

  // public showMoreInfo() {
  //   this.iab.create(this.translate.instant('annual-mean.information-popup.link'), '_system', 'hidden=yes');
  // }

}
