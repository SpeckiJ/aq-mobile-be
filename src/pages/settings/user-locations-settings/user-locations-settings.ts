import { Component, OnDestroy } from '@angular/core';
import { ModalController } from 'ionic-angular';
import { Subscription } from 'rxjs';

import {
  ModalUserLocationCreationComponent,
} from '../../../components/modal-user-location-creation/modal-user-location-creation';
import { ModalUserLocationListComponent } from '../../../components/modal-user-location-list/modal-user-location-list';
import { LocatedTimeseriesService } from '../../../providers/timeseries/located-timeseries';
import { UserLocationListProvider } from '../../../providers/user-location-list/user-location-list';

@Component({
  selector: 'user-locations-settings',
  templateUrl: 'user-locations-settings.html'
})
export class UserLocationsSettingsComponent implements OnDestroy {

  public nearestSeriesByDefault: boolean;

  // public showNearestStations: boolean;
  // private showNearestStationsSubscriber: Subscription;
  //
  // public showSubIndexPanel: boolean;
  // private showSubIndexPanelSubscriber: Subscription;
  //
  // public showAnnualMeanPanel: boolean;
  // private showAnnualPanelSubscriber: Subscription;

  constructor(
    protected modalCtrl: ModalController,
    protected locatedTsSrvc: LocatedTimeseriesService,
    protected userLocationListProvider: UserLocationListProvider
  ) {
    this.nearestSeriesByDefault = this.locatedTsSrvc.getShowNearestSeriesByDefault();
    // this.showNearestStationsSubscriber = this.userLocationListProvider.getShowNearestStations()
    //   .subscribe(val => this.showNearestStations = val);
    // this.showSubIndexPanelSubscriber = this.userLocationListProvider.getShowSubIndexPanel()
    //   .subscribe(val => this.showSubIndexPanel = val);
    // this.showAnnualPanelSubscriber = this.userLocationListProvider.getShowAnnualMeanPanel()
    //   .subscribe(val => this.showAnnualMeanPanel = val);
  }

  public ngOnDestroy() {
  //   this.showNearestStationsSubscriber.unsubscribe();
  //   this.showSubIndexPanelSubscriber.unsubscribe();
  //   this.showAnnualPanelSubscriber.unsubscribe();
  }

  public createNewLocation() {
    this.modalCtrl.create(ModalUserLocationCreationComponent).present();
  }

  public showLocationList() {
    this.modalCtrl.create(ModalUserLocationListComponent).present();
  }

  public toggleNearestSeries() {
    this.locatedTsSrvc.setShowNearestSeriesByDefault(this.nearestSeriesByDefault);
  }

  // public toggleShowNearestStations() {
  //   this.userLocationListProvider.setShowNearestStations(this.showNearestStations);
  // }
  //
  // public toggleShowSubIndexPanel() {
  //   this.userLocationListProvider.setShowSubIndexPanel(this.showSubIndexPanel);
  // }
  //
  // public toggleShowAnnualMeanPanel() {
  //   this.userLocationListProvider.setShowAnnualMeanPanel(this.showAnnualMeanPanel);
  // }

}
