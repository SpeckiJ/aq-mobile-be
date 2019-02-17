import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IonicPageModule } from 'ionic-angular';

// import { ComponentsModule } from '../../components/components.module';
// import { AboutSettingsComponent } from './about-settings/about-settings';
// import { CommonSettingsComponent } from './common-settings/common-settings';
import { FAQPage } from './faq';
// import { UserLocationsSettingsComponent } from './user-locations-settings/user-locations-settings';

@NgModule({
  declarations: [
    // AboutSettingsComponent,
    // CommonSettingsComponent,
    FAQPage
    // UserLocationsSettingsComponent
  ],
  imports: [
    IonicPageModule.forChild(FAQPage),
    // ComponentsModule,
    TranslateModule
  ]
})
export class FAQModule { }
