import { Component, OnInit } from '@angular/core';
import { UserLocation } from '../../services/user-location-list/user-location-list.service';
import { Point } from 'geojson';
import { MapOptions } from 'leaflet';
import { NavParams, ModalController } from '@ionic/angular';

@Component({
  selector: 'modal-edit-user-location',
  templateUrl: './modal-edit-user-location.component.html',
  styleUrls: ['./modal-edit-user-location.component.scss'],
})
export class ModalEditUserLocationComponent {

  public userLocation: UserLocation;

  public point: Point;

  public label: string;

  public mapOptions: MapOptions = {
    maxZoom: 18,
    dragging: true
  };

  constructor(
    private params: NavParams,
    private modalCtrl: ModalController
  ) {
    this.userLocation = this.params.get('userlocation');
    this.label = this.userLocation.label;
    this.point = { type: 'Point', coordinates: [this.userLocation.longitude, this.userLocation.latitude] };
  }

  public onLocationChanged(point: Point) {
    this.userLocation.latitude = point.coordinates[1];
    this.userLocation.longitude = point.coordinates[0];
  }

  public updateLocation() {
    this.userLocation.label = this.label;
    this.modalCtrl.dismiss(this.userLocation);
  }

  public dismiss() {
    this.modalCtrl.dismiss();
  }

}
