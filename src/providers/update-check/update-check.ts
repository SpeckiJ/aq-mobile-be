import { Injectable } from '@angular/core';
import { AppVersion } from '@ionic-native/app-version';
import { Storage } from '@ionic/storage';
import { Platform, PopoverController } from 'ionic-angular';

import { UpdateHintPopoverComponent } from '../../components/update-hint-popover/update-hint-popover';

const STORAGE_LAST_INSTALLED_VERSION_CODE = 'lastInstalledVersionCode';

@Injectable({
  providedIn: 'root'
})
export class UpdateCheckProvider {

  constructor(
    private platform: Platform,
    private appVersion: AppVersion,
    private storage: Storage,
    private popoverCtrl: PopoverController
  ) { }

  public init(): any {
    this.showWindowIfNewVersion();
  }

  private showWindowIfNewVersion() {
    if (this.platform.is('cordova')) {
      // this.storage.remove(STORAGE_LAST_INSTALLED_VERSION_CODE);
      this.storage.get(STORAGE_LAST_INSTALLED_VERSION_CODE)
        .then(lastVC => {
          console.log(`Last version: ${lastVC}`);
          this.appVersion.getVersionCode()
            .then(vCode => {
              if (!lastVC || lastVC.toString() !== vCode.toString()) {
                this.popoverCtrl.create(UpdateHintPopoverComponent, {}, { showBackdrop: true }).present();
              }
              this.storage.set(STORAGE_LAST_INSTALLED_VERSION_CODE, vCode.toString());
            })
        });
    }
  }

}
