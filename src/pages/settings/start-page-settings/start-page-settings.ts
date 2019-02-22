import { Component, OnDestroy } from '@angular/core';
import { ModalController } from 'ionic-angular';
import { Subscription } from 'rxjs';

import { StartPageSettingsProvider } from '../../../providers/start-page-settings/start-page-settings';

@Component({
  selector: 'start-page-settings',
  templateUrl: 'start-page-settings.html'
})
export class StartPageSettingsComponent implements OnDestroy {


  public showNearestStations: boolean;
  private showNearestStationsSubscriber: Subscription;

  public showSubIndexPanel: boolean;
  private showSubIndexPanelSubscriber: Subscription;

  public showAnnualMeanPanel: boolean;
  private showAnnualPanelSubscriber: Subscription;

  constructor(
    protected modalCtrl: ModalController,
    protected startPageSettingsProvider: StartPageSettingsProvider
  ) {
    this.showNearestStationsSubscriber = this.startPageSettingsProvider.getShowNearestStations()
      .subscribe(val => this.showNearestStations = val);
    this.showSubIndexPanelSubscriber = this.startPageSettingsProvider.getShowSubIndexPanel()
      .subscribe(val => this.showSubIndexPanel = val);
    this.showAnnualPanelSubscriber = this.startPageSettingsProvider.getShowAnnualMeanPanel()
      .subscribe(val => this.showAnnualMeanPanel = val);
  }

  public ngOnDestroy() {
    this.showNearestStationsSubscriber.unsubscribe();
    this.showSubIndexPanelSubscriber.unsubscribe();
    this.showAnnualPanelSubscriber.unsubscribe();
  }

  public toggleShowNearestStations() {
    this.startPageSettingsProvider.setShowNearestStations(this.showNearestStations);
  }

  public toggleShowSubIndexPanel() {
    this.startPageSettingsProvider.setShowSubIndexPanel(this.showSubIndexPanel);
  }

  public toggleShowAnnualMeanPanel() {
    this.startPageSettingsProvider.setShowAnnualMeanPanel(this.showAnnualMeanPanel);
  }

}
