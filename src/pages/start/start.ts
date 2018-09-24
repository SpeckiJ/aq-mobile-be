import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { LocateProvider } from '../../providers/locate/locate';
import { UserLocationListProvider } from '../../providers/user-location-list/user-location-list';
import { MapPage } from '../map/map';
import { HeaderContent } from '../../components/belaqi-user-location-slider/belaqi-user-location-slider';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'page-start',
  templateUrl: 'start.html'
})
export class StartPage {

  public locationEnabled: boolean;
  public locationCount: number;
  public name = 'start';

  public sliderHeaderContent: HeaderContent;

  constructor(
    private nav: NavController,
    private locate: LocateProvider,
    private userLocations: UserLocationListProvider,
    public translateSrvc: TranslateService
  ) {
    this.locate.getLocationStateEnabled().subscribe(enabled => this.locationEnabled = enabled);
    this.userLocations.getAllLocations().subscribe(list => this.locationCount = list.length);
  }

  public navigateToMap(phenomenonId: string) {
    this.nav.push(MapPage, { phenomenonId });
  }

  public setHeaderContent(headerContent: HeaderContent) {
    this.sliderHeaderContent = headerContent;
  }

}
