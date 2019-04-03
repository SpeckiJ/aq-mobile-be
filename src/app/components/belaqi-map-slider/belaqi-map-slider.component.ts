import './boundary-canvas';

import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, EventEmitter, Output, ViewChild, AfterViewInit, AfterViewChecked } from '@angular/core';
import { DatasetApiInterface, ParameterFilter, Phenomenon, Platform, SettingsService, Station } from '@helgoland/core';
import { GeoSearchOptions, LayerOptions, MapCache } from '@helgoland/map';
import { IonSlides, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { CacheService } from 'ionic-cache';
import {
  BoundaryCanvasOptions,
  circleMarker,
  CircleMarker,
  geoJSON,
  latLngBounds,
  LatLngExpression,
  Layer,
  popup,
  tileLayer,
  marker,
} from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import moment from 'moment';
import { forkJoin } from 'rxjs';

import {
  MarkerSelectorGenerator,
} from '../customized-station-map-selector/customized-station-map-selector.component';
import { DrawerState } from '../overlay-info-drawer/overlay-info-drawer';
import { getIDForMainPhenomenon, MainPhenomenon } from '../../model/phenomenon';
import { AnnualMeanService } from '../../services/annual-mean/annual-mean.service';
import { IrcelineSettingsService, IrcelineSettings } from '../../services/irceline-settings/irceline-settings.service';
import { MapDataService } from '../../services/map-data/map-data.service';
import { MobileSettings } from '../../services/settings/settings.service';
import { UserLocationListService } from '../../services/user-location-list/user-location-list.service';
import { UserLocation } from '../../services/user-location-list/user-location-list.service';
import { LocateService, LocationStatus } from '../../services/locate/locate.service';
import { RefreshHandler } from '../../services/refresh/refresh.service';
import { NetworkAlertService } from '../../services/network-alert/network-alert.service';
import { ModalSettingsComponent } from '../settings/modal-settings/modal-settings.component';
import { ModalUserLocationCreationComponent } from '../modal-user-location-creation/modal-user-location-creation.component';

enum PhenomenonLabel {
  BelAQI = 'BelAQI',
  NO2 = 'NO2',
  O3 = 'O3',
  PM10 = 'PM10',
  PM25 = 'PM25',
  BC = 'BC'
}

enum TimeLabel {
  current = 'current',
  today = 'today',
  tomorrow = 'tomorrow',
  today2 = 'today2',
  today3 = 'today3'
}

enum MeanLabel {
  hourly = 'hourly',
  daily = '24hour',
  yearly = 'yearly'
}

const phenomenonMapping = [
  {
    label: PhenomenonLabel.BelAQI,
    legendId: 'index'
  }, {
    id: getIDForMainPhenomenon(MainPhenomenon.NO2),
    label: PhenomenonLabel.NO2,
    legendId: 'no2_hmean'
  }, {
    id: getIDForMainPhenomenon(MainPhenomenon.O3),
    label: PhenomenonLabel.O3,
    legendId: 'o3_hmean'
  }, {
    id: getIDForMainPhenomenon(MainPhenomenon.PM10),
    label: PhenomenonLabel.PM10,
    legendId: 'pm10_hmean'
  }, {
    id: getIDForMainPhenomenon(MainPhenomenon.PM25),
    label: PhenomenonLabel.PM25,
    legendId: 'pm25_hmean'
  }, {
    id: getIDForMainPhenomenon(MainPhenomenon.BC),
    label: PhenomenonLabel.BC,
    legendId: 'bc_hmean'
  }
];

export interface HeaderContent {
  label: string;
  date: Date;
  current: boolean;
}

@Component({
  selector: 'belaqi-map-slider',
  templateUrl: './belaqi-map-slider.component.html',
  styleUrls: ['./belaqi-map-slider.component.scss'],
})
export class BelaqiMapSliderComponent implements AfterViewChecked {
  ngAfterViewChecked(): void {
    console.log(document.getElementById('legendmap#0'));
  }
  

  public belaqiMapviews: MapView[];

  @ViewChild('slider')
  slider: IonSlides;

  @Output()
  public headerContent: EventEmitter<HeaderContent> = new EventEmitter();

  public sliderOptions = {
    zoom: false
  };
  dockedHeight = 92;
  drawerState = DrawerState.Docked;
  states = DrawerState;

  public statusIntervalDuration: number;
  public geoSearchOptions: GeoSearchOptions;
  public clusterStations: boolean;
  public providerUrl: string;

  private loadingLocations: boolean = false;
  public currentLocationError: string;

  constructor(
    protected settingsSrvc: SettingsService<MobileSettings>,
    protected mapCache: MapCache,
    protected modalCtrl: ModalController,
    protected ircelineSettings: IrcelineSettingsService,
    protected api: DatasetApiInterface,
    protected cdr: ChangeDetectorRef,
    protected translateSrvc: TranslateService,
    protected http: HttpClient,
    protected cacheService: CacheService,
    protected annualProvider: AnnualMeanService,
    protected mapDataService: MapDataService,
    protected userLocationListService: UserLocationListService,
    protected locate: LocateService,
    protected refreshHandler: RefreshHandler,
    private networkAlert: NetworkAlertService
  ) {
    this.locate.getLocationStatusAsObservable().subscribe(locationStatus => {
      if (locationStatus !== LocationStatus.DENIED) {
        this.loadBelaqis(false);
      }
    });

    this.refreshHandler.onRefresh.subscribe(() => this.loadBelaqis(true));
    this.userLocationListService.locationsChanged.subscribe(() => this.loadBelaqis(false));
    this.networkAlert.onConnected.subscribe(() => this.loadBelaqis(false));
  }

  public ngOnDestroy(): void {
    if (this.refreshHandler) { this.refreshHandler.onRefresh.unsubscribe(); }
    if (this.userLocationListService) { this.userLocationListService.locationsChanged.unsubscribe(); }
    if (this.networkAlert) { this.networkAlert.onConnected.unsubscribe(); }
  }

  private async loadBelaqis(reload: boolean) {
    if (this.userLocationListService.hasLocations() && !this.loadingLocations) {
      this.currentLocationError = null;
      this.loadingLocations = true;
      this.ircelineSettings.getSettings(reload).subscribe(
        ircelineSettings => {
          this.belaqiMapviews = [];
          this.userLocationListService.getVisibleUserLocations().forEach((loc, i) => {
            // Init MapView
            this.belaqiMapviews[i] = new MapView(this.settingsSrvc,
              this.mapCache,
              this.modalCtrl,
              this.ircelineSettings,
              this.api,
              this.cdr,
              this.translateSrvc,
              this.http,
              this.cacheService,
              this.annualProvider,
              this.mapDataService,
              this.userLocationListService,
              "map#" + i.toString(),
              this.slider)

            // Set MapView Location
            if (loc.type !== 'current') {
              this.setLocation(loc, i, ircelineSettings);
            } else {
              this.belaqiMapviews[i].location = {
                type: 'current'
              };
              this.userLocationListService.determineCurrentLocation().subscribe(
                currentLoc => {
                  this.setLocation(currentLoc, i, ircelineSettings);
                  this.setHeader(0);
                },
                error => {
                  this.currentLocationError = error || true;
                }
              );
            }
          });
          setTimeout(() => {
            if (this.slider) {
              this.slider.update();
              this.slider.slideTo(0);
            }
            this.setHeader(0);
          }, 300);
          this.loadingLocations = false;
        },
        error => {
          this.loadingLocations = false;
        });
    }
  }

  private setLocation(loc: UserLocation, i: number, ircelineSettings: IrcelineSettings) {
    this.belaqiMapviews[i].location = {
      label: loc.label,
      date: ircelineSettings.lastupdate,
      type: loc.type,
      latitude: loc.latitude,
      longitude: loc.longitude
    };
    this.belaqiMapviews[i].init();
  }

  private setHeader(idx: number): any {
    if (idx <= this.belaqiMapviews.length - 1) {
      this.headerContent.emit({
        label: this.belaqiMapviews[idx].location.label,
        date: this.belaqiMapviews[idx].location.date,
        current: this.belaqiMapviews[idx].location.type === 'current'
      });
    }
  }

  public slideChanged() {
    this.slider.getActiveIndex().then(idx => this.setHeader(idx));
  }

  public navigateSettings() {
    this.modalCtrl.create({ component: ModalSettingsComponent }).then(modal => modal.present());
  }

  public createNewLocation() {
    this.modalCtrl.create({ component: ModalUserLocationCreationComponent }).then(modal => modal.present());
  }

}

class MapView {
  public location: UserLocation;
  public phenomenonFilter: ParameterFilter;
  public avoidZoomToSelection: boolean;
  public zoomControlOptions: L.Control.ZoomOptions = {};
  public overlayMaps: Map<string, LayerOptions> = new Map<string, LayerOptions>();
  public fitBounds: L.LatLngBoundsExpression;

  public selectedPhenomenonId: string;
  public selectedPhenomenonLabel: string;

  private phenomenonLabel: PhenomenonLabel;
  private nextStationPopup: L.Popup;
  private userLocationMarker: L.Marker;
  public markerSelectorGenerator: MarkerSelectorGenerator;

  private time: TimeLabel;
  private mean: string;
  public show24hourMean: boolean = true;
  public showYearlyMean: boolean = true;
  public disabled: boolean = false;

  public sliderHeader: string = "test";
  public sliderPosition: number;

  public legend: string;

  public loading: boolean;
  public loading_colors: boolean[] = [true, true, true, true, true, true];
  public borderColor: string[] = ["gray", "gray", "gray", "gray", "gray", "gray"]

  public statusIntervalDuration: number;
  public geoSearchOptions: GeoSearchOptions;
  public clusterStations: boolean;
  private providerUrl: string;

  constructor(
    protected settingsSrvc: SettingsService<MobileSettings>,
    protected mapCache: MapCache,
    protected modalCtrl: ModalController,
    protected ircelineSettings: IrcelineSettingsService,
    protected api: DatasetApiInterface,
    protected cdr: ChangeDetectorRef,
    protected translateSrvc: TranslateService,
    protected http: HttpClient,
    protected cacheService: CacheService,
    protected annualProvider: AnnualMeanService,
    protected mapDataService: MapDataService,
    protected userLocationListService: UserLocationListService,
    protected mapId: string,
    protected slider: IonSlides
  ) {
    const settings = this.settingsSrvc.getSettings();
    this.providerUrl = settings.datasetApis[0].url;
    this.clusterStations = settings.clusterStationsOnMap;
    this.statusIntervalDuration = settings.colorizedMarkerForLastMilliseconds;
    this.markerSelectorGenerator = new MarkerSelectorGeneratorImpl(this.mapCache, this.mapId);

    this.setGeosearchOptions(settings);
    this.translateSrvc.onLangChange.subscribe(() => this.setGeosearchOptions);

    // Navigate from normal pane by clicking on panel
    if (this.mapDataService.selection) {
      const phenId = this.mapDataService.selection.phenomenonID;
      this.selectedPhenomenonId = this.mapDataService.selection.phenomenonID;
      this.phenomenonLabel = this.getPhenomenonLabel(phenId);
      this.adjustMeanUI();
      if (this.mapDataService.selection.yearly) {
        this.mean = MeanLabel.yearly;
      } else {
        this.mean = MeanLabel.hourly;
      }
    } else {
      this.phenomenonLabel = PhenomenonLabel.BelAQI;
      this.show24hourMean = false;
      this.showYearlyMean = false;
      this.mean = MeanLabel.hourly;
      this.clearSelectedPhenomenon();
    }
    this.removePopups();
  }

  public init() {
    this.adjustMeanUI();
    this.zoomToLocation();
    this.onSliderChange();
    this.adjustUI();
    this.adjustLegend();
  }

  private removePopups() {
    if (this.nextStationPopup) { this.nextStationPopup.remove(); }
    if (this.userLocationMarker) { this.userLocationMarker.remove(); }
  }

  public mapInitialized(mapId: string) {
    this.zoomToLocation();
    if (this.mapCache.hasMap(this.mapId)) {
      const provider = new OpenStreetMapProvider({ params: { countrycodes: 'be' } });
      const searchControl = new GeoSearchControl({
        provider: provider,
        autoComplete: true
      });
      var map = this.mapCache.getMap(mapId);
      this.mapCache.getMap(mapId).addControl(searchControl);
      // Disable Panning
      map.clearAllEventListeners();
      map.addEventListener("movestart", ((ev) => {
        this.slider.lockSwipes(true);
      }))
      map.addEventListener("moveend", ((ev) => {
        this.slider.lockSwipes(false);
      }))
    }
  }

  public onPhenomenonChange(): void {
    if (this.nextStationPopup) { this.nextStationPopup.remove(); }
    const phenID = this.getPhenomenonID(this.phenomenonLabel);
    if (phenID) {
      this.getPhenomenonFromAPI(phenID);
      this.selectedPhenomenonId = phenID;
    } else {
      this.clearSelectedPhenomenon();
    }
    if (this.phenomenonLabel === PhenomenonLabel.BC) {
      this.time = TimeLabel.current;
    }
    this.adjustMeanUI();
    this.onSliderChange();
    this.adjustUI();
    this.adjustLegend();
  }

  /**
   * Translates slider position into time+mean combinations
   */
  public onSliderChange() {
    var correctedSliderPos = this.sliderPosition;

    if (!this.show24hourMean && this.sliderPosition > 1) {
      correctedSliderPos++;
    }

    switch (correctedSliderPos) {
      case 0:
        // amean
        this.time = TimeLabel.current;
        this.mean = MeanLabel.yearly;
        this.sliderHeader = this.translateSrvc.instant("map.timestepLabels.amean");
        break;
      case 1:
        // hmean
        this.time = TimeLabel.current;
        this.mean = MeanLabel.hourly;
        this.sliderHeader = this.translateSrvc.instant("map.timestepLabels.hmean");
        break;
      case 2:
        // 24hmean
        this.time = TimeLabel.current;
        this.mean = MeanLabel.daily;
        this.sliderHeader = this.translateSrvc.instant("map.timestepLabels.24hmean");
        break;
      case 3:
        // dmean forecast today
        this.time = TimeLabel.today;
        this.sliderHeader = this.translateSrvc.instant("map.timestepLabels.dmean_forecast_today");
        break;
      case 4:
        // dmean forecast tomorrow
        this.time = TimeLabel.tomorrow;
        this.sliderHeader = this.translateSrvc.instant("map.timestepLabels.dmean_forecast_tomorrow");
        break;
      case 5:
        // dmean forecast today+2
        this.time = TimeLabel.today2;
        this.sliderHeader = this.translateSrvc.instant("map.timestepLabels.dmean_forecast_today+2");
        break;
      case 6:
        // dmean forecast today+3
        this.time = TimeLabel.today3;
        this.sliderHeader = this.translateSrvc.instant("map.timestepLabels.dmean_forecast_today+3");
    }

    this.adjustUI();
  }

  /**
   * Sets up showYearly + show24Hour upon selecting a Phenomenon in the Top bar.
   */
  private adjustMeanUI() {
    let show24hour = false;
    let showYearly = false;
    switch (this.selectedPhenomenonId) {
      case getIDForMainPhenomenon(MainPhenomenon.BC):
        showYearly = true;
        this.disabled = true;
        break;
      case getIDForMainPhenomenon(MainPhenomenon.NO2):
        showYearly = true;
        show24hour = false;
        break;
      case getIDForMainPhenomenon(MainPhenomenon.O3):
        break;
      case getIDForMainPhenomenon(MainPhenomenon.PM10):
        show24hour = true;
        showYearly = true;
        break;
      case getIDForMainPhenomenon(MainPhenomenon.PM25):
        show24hour = true;
        showYearly = true;
        break;
      default:
        break;
    }
    this.show24hourMean = show24hour;
    this.showYearlyMean = showYearly;
    if (this.time !== TimeLabel.current) {
      this.mean = null;
    }

    // Reset slider
    if (!this.showYearlyMean) {
      this.sliderPosition = 1;
    } else {
      this.sliderPosition = 0;
    }
  }

  public onStationSelected(platform: Platform) {
    // const modal = this.modalCtrl.create(StationSelectorComponent,
    //   {
    //     platform,
    //     providerUrl: this.providerUrl,
    //     phenomenonId: this.selectedPhenomenonId
    //   }
    // );
    // modal.onDidDismiss(data => { if (data) { this.navCtrl.push(DiagramPage) } });
    // modal.present();
  }

  public onMapLoading(loading: boolean) {
    this.loading = loading;
    this.cdr.detectChanges();
  }

  private setGeosearchOptions(settings: MobileSettings) {
    this.geoSearchOptions = { countrycodes: settings.geoSearchCountryCodes, acceptLanguage: this.translateSrvc.currentLang };
  }

  private zoomToLocation() {
    if (this.mapCache.hasMap(this.mapId)) {
      const map = this.mapCache.getMap(this.mapId);
      const selection = this.mapDataService.selection;
      if (selection) {
        const location = { lat: selection.userlocation.latitude, lng: selection.userlocation.longitude } as LatLngExpression;
        /*         const label = selection.userlocation.type === 'user'
                  ? this.translateSrvc.instant('map.configured-location') : this.translateSrvc.instant('map.current-location');
                this.userLocationMarker = popup({ autoPan: false })
                  .setLatLng(location)
                  .setContent(label);
                map.addLayer(this.userLocationPopup); */

        this.userLocationMarker = marker(location);
        map.addLayer(this.userLocationMarker);

        const bounds = latLngBounds(location, location);
        if (selection.stationlocation) {
          const station = { lat: selection.stationlocation.latitude, lng: selection.stationlocation.longitude } as LatLngExpression;
          this.nextStationPopup = popup({ autoPan: false })
            .setLatLng(station)
            .setContent(this.translateSrvc.instant('map.nearest-station'));
          map.addLayer(this.nextStationPopup);
          bounds.extend(station);
        }

        map.fitBounds(bounds, { padding: [70, 70], maxZoom: 12 });
      } else {
        const location = { lat: this.location.latitude, lng: this.location.longitude } as LatLngExpression;
        this.userLocationMarker = marker(location);
        map.addLayer(this.userLocationMarker);
        map.fitBounds(latLngBounds(location, location), { padding: [200, 200], maxZoom: 12 });
      }
    }
  }

  private adjustLegend(): void {
    const langCode = this.translateSrvc.currentLang.toLocaleUpperCase();
    const legendId = this.getPhenomenonLegendId(this.phenomenonLabel);
    console.log(document.getElementById('legend' + this.mapId));
    this.legend = ` <object style='width:100%' data='../../assets/svg/${legendId}_${langCode}_wide.svg'></object>`;
  }

  private clearSelectedPhenomenon() {
    this.selectedPhenomenonId = null;
    this.selectedPhenomenonLabel = null;
  }

  private getPhenomenonID(label: PhenomenonLabel): string {
    const phen = phenomenonMapping.find(e => label === e.label);
    if (phen) { return phen.id; }
  }

  private getPhenomenonLabel(id: string): PhenomenonLabel {
    const phen = phenomenonMapping.find(e => id === e.id);
    if (phen) { return phen.label; }
  }

  private getPhenomenonLegendId(phenLabel: PhenomenonLabel): string {
    const phen = phenomenonMapping.find(e => phenLabel === e.label);
    if (phen && phen.legendId) { return phen.legendId; }
  }

  private getPhenomenonFromAPI(phenId: string) {
    this.api.getPhenomenon(phenId, this.providerUrl).subscribe(
      phenomenon => this.setPhenomenon(phenomenon),
      error => {
        this.clearSelectedPhenomenon();
        this.phenomenonLabel = this.getPhenomenonLabel(phenId);
      }
    );
  }

  private setPhenomenon(selectedPhenomenon: Phenomenon) {
    this.selectedPhenomenonLabel = selectedPhenomenon.label;
  }

  private adjustUI() {
    // set filter for stations, show on current time and hourly mean only
    if (this.time === TimeLabel.current && this.mean === MeanLabel.hourly) {
      this.phenomenonFilter = { phenomenon: this.selectedPhenomenonId };
    } else {
      this.phenomenonFilter = { phenomenon: '' };
    }
    this.adjustLayer();
  }

  private adjustLayer() {
    const request = this.http.get('./assets/multipolygon.json');
    this.cacheService.loadFromObservable('multipolygon', request, null, 60 * 60 * 24).subscribe((geojson: GeoJSON.GeoJsonObject) => {
      this.overlayMaps = new Map<string, LayerOptions>();
      let layerId: string;
      let wmsUrl: string;
      let timeParam: string;
      if (this.time === TimeLabel.current) {
        forkJoin(
          this.annualProvider.getYear(),
          this.ircelineSettings.getSettings(false)
        ).subscribe(result => {
          wmsUrl = 'http://geo5.irceline.be/rioifdm/wms';
          const lastUpdate = result[1].lastupdate.toISOString();
          const year = result[0];
          switch (this.phenomenonLabel) {
            case PhenomenonLabel.BelAQI:
              this.drawLayer(wmsUrl, 'belaqi', geojson, lastUpdate);
              break;
            case PhenomenonLabel.BC:
              if (this.mean === MeanLabel.hourly) { this.drawLayer(wmsUrl, 'bc_hmean', geojson, lastUpdate); }
              if (this.mean === MeanLabel.yearly) { this.drawLayer(wmsUrl, `bc_anmean_${year}_atmostreet`, geojson); }
              break;
            case PhenomenonLabel.NO2:
              if (this.mean === MeanLabel.hourly) { this.drawLayer(wmsUrl, 'no2_hmean', geojson, lastUpdate); }
              if (this.mean === MeanLabel.yearly) { this.drawLayer(wmsUrl, `no2_anmean_${year}_atmostreet`, geojson); }
              break;
            case PhenomenonLabel.O3:
              if (this.mean === MeanLabel.hourly) { this.drawLayer(wmsUrl, 'o3_hmean', geojson, lastUpdate); }
              break;
            case PhenomenonLabel.PM10:
              if (this.mean === MeanLabel.hourly) { this.drawLayer(wmsUrl, 'pm10_hmean', geojson, lastUpdate); }
              if (this.mean === MeanLabel.daily) { this.drawLayer(wmsUrl, 'pm10_24hmean', geojson, lastUpdate); }
              if (this.mean === MeanLabel.yearly) { this.drawLayer(wmsUrl, `pm10_anmean_${year}_atmostreet`, geojson); }
              break;
            case PhenomenonLabel.PM25:
              if (this.mean === MeanLabel.hourly) { this.drawLayer(wmsUrl, 'pm25_hmean', geojson, lastUpdate); }
              if (this.mean === MeanLabel.daily) { this.drawLayer(wmsUrl, 'pm25_24hmean', geojson, lastUpdate); }
              if (this.mean === MeanLabel.yearly) { this.drawLayer(wmsUrl, `pm25_anmean_${year}_atmostreet`, geojson); }
              break;
            default:
              break;
          }
        });
      } else {
        wmsUrl = 'http://geo5.irceline.be/forecast/wms';
        switch (this.phenomenonLabel) {
          case PhenomenonLabel.BelAQI:
            layerId = 'belaqi';
            break;
          case PhenomenonLabel.NO2:
            layerId = 'no2_maxhmean';
            break;
          case PhenomenonLabel.O3:
            layerId = 'o3_maxhmean';
            break;
          case PhenomenonLabel.PM10:
            layerId = 'pm10_dmean';
            break;
          case PhenomenonLabel.PM25:
            layerId = 'pm25_dmean';
            break;
          default:
            break;
        }
        switch (this.time) {
          case TimeLabel.today:
            timeParam = moment().format('YYYY-MM-DD');
            break;
          case TimeLabel.tomorrow:
            timeParam = moment().add(1, 'day').format('YYYY-MM-DD');
            break;
          case TimeLabel.today2:
            timeParam = moment().add(2, 'day').format('YYYY-MM-DD');
            break;
          case TimeLabel.today3:
            timeParam = moment().add(3, 'day').format('YYYY-MM-DD');
            break;
          default:
            break;
        }
      }
      this.drawLayer(wmsUrl, layerId, geojson, timeParam);
    });
  }

  private drawLayer(wmsUrl: string, layerId: string, geojson: GeoJSON.GeoJsonObject, timeParam?: string) {
    if (layerId) {
      const layerOptions: BoundaryCanvasOptions = {
        layers: layerId,
        transparent: true,
        format: 'image/png',
        tiled: 'true',
        opacity: 0.7,
        boundary: geojson,
        useBoundaryGreaterAsZoom: 12
      };
      if (timeParam) {
        layerOptions.time = timeParam;
      }
      this.overlayMaps.set(layerId + wmsUrl + timeParam, {
        label: this.translateSrvc.instant('map.interpolated-map'),
        visible: true,
        layer: tileLayer.boundaryCanvas(wmsUrl, layerOptions)
      });
    }
  }
}


class MarkerSelectorGeneratorImpl implements MarkerSelectorGenerator {

  constructor(
    private mapCache: MapCache,
    private mapId: string
  ) { }

  createFilledMarker(station: Station, color: string): Layer {
    let geometry: Layer;
    if (station.geometry.type === 'Point') {
      const point = station.geometry as GeoJSON.Point;
      geometry = circleMarker([point.coordinates[1], point.coordinates[0]], {
        color: '#000',
        fillColor: color,
        fillOpacity: 0.8,
        radius: this.calculateRadius(),
        weight: 2
      });
      if (this.mapCache.hasMap(this.mapId)) {
        this.mapCache.getMap(this.mapId).on('zoomend', () => {
          (geometry as CircleMarker).setRadius(this.calculateRadius());
        });
      }
    } else {
      geometry = geoJSON(station.geometry, {
        style: (feature) => {
          return {
            color: '#000',
            fillColor: color,
            fillOpacity: 0.8,
            weight: 2
          };
        }
      });
    }
    return geometry;
  }

  createDefaultFilledMarker(station: Station): Layer {
    return this.createFilledMarker(station, '#fff');
  }

  private calculateRadius(): number {
    if (this.mapCache.hasMap(this.mapId)) {
      const currentZoom = this.mapCache.getMap(this.mapId).getZoom();
      if (currentZoom <= 7) { return 6; }
      return currentZoom;
    } else {
      return 6;
    }
  }
}