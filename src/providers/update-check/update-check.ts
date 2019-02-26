import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { PopoverController } from 'ionic-angular';

import { UpdateHintPopoverComponent } from '../../components/update-hint-popover/update-hint-popover';

const STORAGE_DONT_SHOW_ON_STARTUP = 'dontShowPopupOnStartup';

@Injectable({
  providedIn: 'root'
})
export class UpdateCheckProvider {

  constructor(
    private storage: Storage,
    private popoverCtrl: PopoverController,
  ) { }

  public init(): any {
    this.showWindowIfNewVersion();
  }

  public setDontShowOnStartup(dontShow: boolean) {
    this.storage.set(STORAGE_DONT_SHOW_ON_STARTUP, dontShow);
  }

  private showWindowIfNewVersion() {
    this.storage.get(STORAGE_DONT_SHOW_ON_STARTUP)
      .then(dontShowOnStartup => {
        if (dontShowOnStartup === null || !dontShowOnStartup) {
          this.popoverCtrl.create(UpdateHintPopoverComponent, {}, { showBackdrop: true }).present();
        }
      });
  }

}