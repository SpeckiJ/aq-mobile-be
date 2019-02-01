import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';

import { LocationStatus } from '../../providers/locate/locate';

@Component({
  selector: 'geolocation-enabled-popup',
  templateUrl: 'geolocation-enabled-popup.html'
})
export class GeolocationEnabledPopupComponent {

  locationMode: LocationStatus;

  constructor(
    private navParams: NavParams
  ) {
    this.locationMode = this.navParams.get('locationMode');
  }

}
