import { AfterViewInit, Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, NavController, PopoverController, Slides, Toggle } from 'ionic-angular';

import { SettingsPage } from '../../pages/settings/settings';
import { IrcelineSettings, IrcelineSettingsProvider } from '../../providers/irceline-settings/irceline-settings';
import { LocateProvider, LocationStatus } from '../../providers/locate/locate';
import { NetworkAlertProvider } from '../../providers/network-alert/network-alert';
import { RefreshHandler } from '../../providers/refresh/refresh';
import { LocatedTimeseriesService } from '../../providers/timeseries/located-timeseries';
import { UserLocation, UserLocationListProvider } from '../../providers/user-location-list/user-location-list';
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
  phenomenonStation: PhenomenonLocationSelection,
  location: {
    longitude: number;
    latitude: number;
    label: string;
    type: 'user' | 'current';
  }
}

// const LOCATION_DELAYED_NOTIFICATION_IN_MILLISECONDS = 3000;

@Component({
  selector: 'belaqi-user-location-slider',
  templateUrl: 'belaqi-user-location-slider.html'
})
export class BelaqiUserLocationSliderComponent implements AfterViewInit {

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

  public waitForWheel: boolean;
  public waitForChart: boolean;
  public waitForNearestStations: boolean;

  constructor(
    private userLocationProvider: UserLocationListProvider,
    private locatedTimeseriesProvider: LocatedTimeseriesService,
    private ircelineSettings: IrcelineSettingsProvider,
    private locate: LocateProvider,
    private networkAlert: NetworkAlertProvider,
    private nav: NavController,
    protected translateSrvc: TranslateService,
    protected modalCtrl: ModalController,
    protected refresher: RefreshHandler,
    private popoverCtrl: PopoverController
  ) {
    this.locate.getLocationStatusAsObservable().subscribe(locationStatus => {
      if (locationStatus != LocationStatus.DENIED) {
        this.loadBelaqis(false);
      }
    });
    this.refresher.onRefresh.subscribe(() => this.loadBelaqis(true));
    this.userLocationProvider.locationsChanged.subscribe(() => this.loadBelaqis(false));
    this.networkAlert.onConnected.subscribe(() => this.loadBelaqis(false));
  }

  public ngAfterViewInit(): void {
    this.setHeight();
    if (this.slider) {
      this.slider.autoHeight = true;
    }
  }

  public selectPhenomenon(selection: PhenomenonLocationSelection, userlocation: UserLocation) {
    this.phenomenonSelected.emit({
      phenomenonStation: selection,
      location: {
        latitude: userlocation.latitude,
        longitude: userlocation.longitude,
        label: userlocation.label,
        type: userlocation.type
      }
    });
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

  public toggle(toggle: Toggle) {
    this.userLocationProvider.setCurrentLocationVisisble(toggle.value);
  }

  public navigateSettings() {
    this.nav.push(SettingsPage);
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
      this.waitForChart = true;
      this.waitForWheel = true;
      this.waitForNearestStations = true;
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

  public wheelReady() {
    this.waitForWheel = false;
    this.resizeSlide();
  }

  public chartReady() {
    this.waitForChart = false;
    this.resizeSlide();
  }

  public nearestStationsReady() {
    this.waitForNearestStations = false;
    this.resizeSlide();
  }

  private allReady(): boolean {
    return !this.waitForChart && !this.waitForNearestStations && !this.waitForWheel;
  }

  private resizeSlide() {
    if (this.allReady()) {
      document.querySelector('.swiper-wrapper')['style'].height = 'auto';
    }
  }

}
