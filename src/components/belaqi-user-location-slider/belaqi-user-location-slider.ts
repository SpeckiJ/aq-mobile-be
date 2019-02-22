import { AfterViewInit, Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, NavController, PopoverController, Slides, ToastController } from 'ionic-angular';
import { Subscription } from 'rxjs';

import { FAQPage } from '../../pages/faq/faq';
import { SettingsPage } from '../../pages/settings/settings';
import { IrcelineSettings, IrcelineSettingsProvider } from '../../providers/irceline-settings/irceline-settings';
import { LocateProvider, LocationStatus } from '../../providers/locate/locate';
import { NetworkAlertProvider } from '../../providers/network-alert/network-alert';
import { RefreshHandler } from '../../providers/refresh/refresh';
import { LocatedTimeseriesService } from '../../providers/timeseries/located-timeseries';
import { UserLocation, UserLocationListProvider } from '../../providers/user-location-list/user-location-list';
import { StartPageSettingsProvider } from '../../providers/start-page-settings/start-page-settings';
import { ModalUserLocationCreationComponent } from '../modal-user-location-creation/modal-user-location-creation';
import { ModalUserLocationListComponent } from '../modal-user-location-list/modal-user-location-list';
import { PhenomenonLocationSelection } from '../nearest-measuring-station-panel/nearest-measuring-station-panel-entry';
import { BelaqiLocateDelayedInformationComponent } from './belaqi-locate-delayed-information';

export interface HeaderContent {
  label: string;
  date: Date;
  current: boolean;
}

export interface BelaqiSelection {
  stationlocation?: {
    longitude: number;
    latitude: number;
  }
  phenomenonID: string;
  userlocation: {
    longitude: number;
    latitude: number;
    label: string;
    type: 'user' | 'current';
  };
  yearly: boolean;
}

@Component({
  selector: 'belaqi-user-location-slider',
  templateUrl: 'belaqi-user-location-slider.html'
})
export class BelaqiUserLocationSliderComponent implements AfterViewInit, OnDestroy {

  @ViewChild('slider')
  slider: Slides;

  @Output()
  public phenomenonSelected: EventEmitter<BelaqiSelection> = new EventEmitter();

  @Output()
  public headerContent: EventEmitter<HeaderContent> = new EventEmitter();

  public belaqiLocations: UserLocation[] = [];
  public currentLocation: UserLocation;

  public showCurrentLocation: boolean;

  public slidesHeight: string;

  public currentLocationError: string;

  public showNearestStationsPanel: boolean;
  private showNearestStationsSubscriber: Subscription;

  public showSubIndexPanel: boolean;
  private showSubIndexPanelSubscriber: Subscription;

  public showAnnualMeanPanel: boolean;
  private showAnnualMeanPanelSubscriber: Subscription;

  private refresherSubscriber: Subscription;
  private locationStatusSubscriber: Subscription;
  private locChangedSubscriber: Subscription;
  private networkSubscriber: Subscription;

  constructor(
    private userLocationProvider: UserLocationListProvider,
    private startPageSettingsProvider: StartPageSettingsProvider,
    private locatedTimeseriesProvider: LocatedTimeseriesService,
    private ircelineSettings: IrcelineSettingsProvider,
    private locate: LocateProvider,
    private networkAlert: NetworkAlertProvider,
    private nav: NavController,
    protected translateSrvc: TranslateService,
    protected modalCtrl: ModalController,
    protected refreshHandler: RefreshHandler,
    private popoverCtrl: PopoverController,
    private toast: ToastController
  ) {
    this.locate.getLocationStatusAsObservable().subscribe(locationStatus => {
      if (locationStatus !== LocationStatus.DENIED) {
        this.loadBelaqis(false);
      }
    });
    this.refreshHandler.onRefresh.subscribe(() => this.loadBelaqis(true));
    this.userLocationProvider.locationsChanged.subscribe(() => this.loadBelaqis(false));
    this.userLocationProvider.locationsChanged.subscribe(() => this.loadBelaqis(false));
    this.networkAlert.onConnected.subscribe(() => this.loadBelaqis(false));
    this.showNearestStationsSubscriber = this.startPageSettingsProvider.getShowNearestStations().subscribe(val => this.showNearestStationsPanel = val);
    this.showSubIndexPanelSubscriber = this.startPageSettingsProvider.getShowSubIndexPanel().subscribe(val => this.showSubIndexPanel = val);
    this.showAnnualMeanPanelSubscriber = this.startPageSettingsProvider.getShowAnnualMeanPanel().subscribe(val => this.showAnnualMeanPanel = val);
  }

  public ngAfterViewInit() {
    this.setHeight();
    if (this.slider) {
      this.slider.autoHeight = true;
    }
  }

  public ngOnDestroy(): void {
    if (this.refresherSubscriber) { this.refresherSubscriber.unsubscribe(); }
    if (this.locationStatusSubscriber) { this.locationStatusSubscriber.unsubscribe(); }
    if (this.locChangedSubscriber) { this.locChangedSubscriber.unsubscribe(); }
    if (this.networkSubscriber) { this.networkSubscriber.unsubscribe(); }
    if (this.showNearestStationsSubscriber) { this.showNearestStationsSubscriber.unsubscribe(); }
    if (this.showSubIndexPanelSubscriber) { this.showSubIndexPanelSubscriber.unsubscribe(); }
    if (this.showAnnualMeanPanelSubscriber) { this.showAnnualMeanPanelSubscriber.unsubscribe(); }
  }

  public selectPhenomenonLocation(selection: PhenomenonLocationSelection, userlocation: UserLocation, yearly: boolean) {
    this.phenomenonSelected.emit({
      phenomenonID: selection.phenomenonId,
      stationlocation: {
        latitude: selection.latitude,
        longitude: selection.longitude
      },
      userlocation: {
        latitude: userlocation.latitude,
        longitude: userlocation.longitude,
        label: userlocation.label,
        type: userlocation.type
      },
      yearly
    });
  }

  public selectPhenomenon(phenId: string, userlocation: UserLocation, yearly: boolean) {
    this.phenomenonSelected.emit({
      phenomenonID: phenId,
      userlocation: {
        latitude: userlocation.latitude,
        longitude: userlocation.longitude,
        label: userlocation.label,
        type: userlocation.type
      },
      yearly
    })
  }

  public createNewLocation() {
    this.modalCtrl.create(ModalUserLocationCreationComponent).present();
  }

  public openUserLocation() {
    this.modalCtrl.create(ModalUserLocationListComponent).present();
  }

  public slideChanged() {
    let currentIndex = this.slider.getActiveIndex();
    this.updateLocationSelection(currentIndex);
  }

  public changeCurrentLocation() {
    if (this.showCurrentLocation) {
      if (this.locate.getLocationStatus() === LocationStatus.DENIED) {
        this.locate.askForPermission()
          .then(permission => {
            if (permission) {
              this.updateShowCurrentLocation(true);
            } else {
              this.showCurrentLocation = false;
            }
          })
          .catch(error => this.presentError(error))
      } else {
        this.updateShowCurrentLocation(true);
      }
    } else {
      this.updateShowCurrentLocation(false);
    }
  }

  private presentError(error: any) {
    this.toast.create({ message: `Error occured: ${JSON.stringify(error)}`, duration: 3000 }).present();
  }

  private updateShowCurrentLocation(value: boolean) {
    this.userLocationProvider.setCurrentLocationVisisble(value);
    this.showCurrentLocation = value;
  }

  public navigateSettings() {
    this.nav.push(SettingsPage);
  }

  public navigateFAQ() {
    this.modalCtrl.create(FAQPage).present();
  }

  public isLocateDenied(): boolean {
    return this.locate.getLocationStatus() === LocationStatus.DENIED;
  }

  private setHeight() {
    const outerElem = document.querySelector('.scroll-content');
    const headerHeight = document.querySelector('.location-header').clientHeight;
    const height = outerElem.clientHeight - headerHeight - (13 * 2) - 19;
    this.slidesHeight = `${height}px`;
  }

  private updateLocationSelection(idx: number) {
    this.setHeader(idx);
    if (this.slider) {
      this.setHeight();
      if (idx <= this.belaqiLocations.length - 1) {
        this.locatedTimeseriesProvider.setSelectedIndex(idx);
        this.locatedTimeseriesProvider.removeAllDatasets();
      } else {
        this.headerContent.emit(null);
      }
    }
  }

  private setHeader(idx: number): any {
    if (idx <= this.belaqiLocations.length - 1) {

      this.headerContent.emit({
        label: this.belaqiLocations[idx].label,
        date: this.belaqiLocations[idx].date,
        current: this.belaqiLocations[idx].type === 'current'
      });
    }
  }

  private getYPosition(el) {
    var yPos = 0;
    while (el) {
      yPos += (el.offsetTop - el.clientTop);
      el = el.offsetParent;
    }
    return yPos;
  }

  private loadBelaqis(reload: boolean) {
    if (this.userLocationProvider.hasLocations()) {
      this.currentLocationError = null;
      const previousActiveIndex = this.slider.getActiveIndex();
      this.ircelineSettings.getSettings(reload).subscribe(ircelineSettings => {
        this.belaqiLocations = [];
        this.userLocationProvider.getVisibleUserLocations().forEach((loc, i) => {
          if (loc.type !== 'current') {
            this.setLocation(loc, i, ircelineSettings);
          } else {
            this.belaqiLocations[i] = {
              type: 'current'
            }
            // let timeout = window.setTimeout(() => this.presentDelayedLocateHint(), LOCATION_DELAYED_NOTIFICATION_IN_MILLISECONDS);
            this.userLocationProvider.determineCurrentLocation().subscribe(
              currentLoc => {
                this.setLocation(currentLoc, i, ircelineSettings);
                this.updateLocationSelection(0);
                // clearTimeout(timeout);
              },
              error => {
                // this.presentDelayedLocateHint();
                this.currentLocationError = error || true;
              }
            )
          }
        });
        setTimeout(() => {
          if (this.slider && previousActiveIndex !== 0) {
            this.slider.update();
            this.slider.slideTo(0);
          }
          this.updateLocationSelection(0);
        }, 300);
        this.showCurrentLocation = this.userLocationProvider.isCurrentLocationVisible();
      });
    }
  }

  private setLocation(loc: UserLocation, i: number, ircelineSettings: IrcelineSettings) {
    this.belaqiLocations[i] = {
      label: loc.label,
      date: ircelineSettings.lastupdate,
      type: loc.type,
      latitude: loc.latitude,
      longitude: loc.longitude
    };
  }

  private handleError(lon: number, lat: number, error: any) {
    console.warn(`Belaqi for (latitude: ${lat}, longitude ${lon}): ${error} - maybe outside of Belgium`);
  }

  private presentDelayedLocateHint() {
    const idx = this.slider.getActiveIndex();
    if (idx >= 0 && idx < this.belaqiLocations.length) {
      if (this.belaqiLocations[idx].type === 'current') {
        this.slider.slideNext();
        const popover = this.popoverCtrl.create(BelaqiLocateDelayedInformationComponent, {}, { showBackdrop: true });
        popover.present();
      }
    }
  }

  public resizeSlide() {
    document.querySelector('.swiper-wrapper')['style'].height = 'auto';
  }

}
