import { Component } from '@angular/core';
import { SettingsService } from '@helgoland/core';
import { LayerOptions, MapCache } from '@helgoland/map';
import { TranslateService } from '@ngx-translate/core';
import { NavParams, ViewController } from 'ionic-angular';
import { LatLngExpression, popup, tileLayer, TileLayerOptions } from 'leaflet';

import { AnnualMeanProvider, AnnualPhenomenonMapping } from '../../providers/annual-mean/annual-mean';
import { MobileSettings } from '../../providers/settings/settings';

@Component({
  selector: 'modal-annual-map',
  templateUrl: 'modal-annual-map.html'
})
export class ModalAnnualMapComponent {

  public mapId = 'annual-map';
  public fitBounds: L.LatLngBoundsExpression;
  public zoomControlOptions: L.Control.ZoomOptions = {};
  public layerControlOptions: L.Control.LayersOptions = { position: "bottomleft", hideSingleBase: true };
  public overlayMaps: Map<string, LayerOptions> = new Map<string, LayerOptions>();

  public year: string;
  public phenomenonLabel: string;

  constructor(
    private params: NavParams,
    private viewCtrl: ViewController,
    private settingsSrvc: SettingsService<MobileSettings>,
    private annualMean: AnnualMeanProvider,
    private mapCache: MapCache,
    private translateSrvc: TranslateService
  ) { }

  public mapInitialized() {
    this.setOverlayMap(this.params.get('phenomenon'));
    const location = this.params.get('location') as GeoJSON.Point;
    if (location) {
      const label = this.translateSrvc.instant('map.configured-location');
      const point: LatLngExpression = { lng: location.coordinates[0], lat: location.coordinates[1] };
      this.mapCache.getMap(this.mapId).addLayer(
        popup({ autoPan: false })
          .setLatLng(point)
          .setContent(label)
      )
      this.mapCache.getMap(this.mapId).setView(point, 12);
    } else {
      this.fitBounds = this.settingsSrvc.getSettings().defaultBbox;
    }
  }

  public onPhenomenonChange(): void {
    this.setOverlayMap(this.phenomenonLabel);
  }

  public dismiss() {
    this.viewCtrl.dismiss();
  }

  private setOverlayMap(phenomenon) {
    this.annualMean.getYear().subscribe(year => {
      this.overlayMaps.clear();
      this.year = year;
      const layerId = this.createLayerId(phenomenon, year);
      this.phenomenonLabel = phenomenon;
      const wmsUrl = `http://geo.irceline.be/rioifdm/${layerId}/wms`;
      const layerOptions: TileLayerOptions = {
        layers: layerId,
        transparent: true,
        format: 'image/png',
        opacity: 0.7,
        useBoundaryGreaterAsZoom: 12
      }
      this.overlayMaps.set(wmsUrl + layerId, {
        label: 'layer',
        visible: true,
        layer: tileLayer.wms(wmsUrl, layerOptions)
      })
    })
  }

  private createLayerId(phenomenon: string, year: string): string {
    switch (phenomenon) {
      case 'NO2': return this.annualMean.getLayerId(year, AnnualPhenomenonMapping.NO2);
      case 'O3': return this.annualMean.getLayerId(year, AnnualPhenomenonMapping.O3);
      case 'PM10': return this.annualMean.getLayerId(year, AnnualPhenomenonMapping.PM10);
      case 'PM25': return this.annualMean.getLayerId(year, AnnualPhenomenonMapping.PM25);
      case 'BC': return this.annualMean.getLayerId(year, AnnualPhenomenonMapping.BC);
    }
  }

}
