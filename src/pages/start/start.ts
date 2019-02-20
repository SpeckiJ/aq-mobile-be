import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, Platform, Refresher, ToastController } from 'ionic-angular';

import { BelaqiSelection, HeaderContent } from '../../components/belaqi-user-location-slider/belaqi-user-location-slider';
import { RefreshHandler } from '../../providers/refresh/refresh';
import { MapPage } from '../map/map';

@Component({
  selector: 'page-start',
  templateUrl: 'start.html'
})
export class StartPage {

  public name = 'start';

  public sliderHeaderContent: HeaderContent;

  constructor(
    private nav: NavController,
    private refreshHandler: RefreshHandler,
    private platform: Platform,
    private toast: ToastController,
    public translateSrvc: TranslateService
  ) { }

  public navigateToMap(selection: BelaqiSelection) {
    this.nav.push(MapPage, { belaqiSelection: selection });
  }

  public setHeaderContent(headerContent: HeaderContent) {
    let visibility;
    if (headerContent) {
      visibility = 'inherit';
      this.sliderHeaderContent = headerContent;
    } else {
      visibility = 'hidden';
    }
    const locationHeaderElems = document.querySelectorAll('.location-header');
    for (let i = 0; i < locationHeaderElems.length; i++) {
      (locationHeaderElems[i] as HTMLElement).style.visibility = visibility;
    }
  }

  public doRefresh(refresher: Refresher) {
    this.refreshHandler.refresh();
    if (this.platform.is('cordova')) {
      this.toast.create({
        message: this.translateSrvc.instant('refresh-button.message'),
        duration: 3000
      }).present();
    }
    setTimeout(() => refresher.complete(), 1000);
  }

}
