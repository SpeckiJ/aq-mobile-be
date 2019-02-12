import { Component } from '@angular/core';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'sub-index-panel-information-popup',
  templateUrl: 'sub-index-panel-information-popup.html'
})
export class SubIndexPanelInformationPopupComponent {

  constructor(
    private iab: InAppBrowser,
    private translate: TranslateService
  ) { }

  public showMoreInfo() {
    this.iab.create(this.translate.instant('sub-index-panel.information-popup.link'), '_system', 'hidden=yes');
  }

}
