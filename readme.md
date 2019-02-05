# aq-mobile-be
This repository contains an [Ionic](https://ionicframework.com/getting-started) app for exploring air quality data using elements from the [Helgoland](https://github.com/52North/helgoland) viewer. [Helgoland](https://github.com/52North/helgoland) is a lightweight web application for exploring Sensor Web Data from the [52°North](https://52north.org/) SWE-suite.

Getting started:
```sh
git clone https://github.com/irceline/aq-mobile-be.git

cd aq-mobile-be
npm install
npm start
```
A local webserver should be launched on port `8100`:

* http://localhost:8100/

## Push-Notifications

### Configuration

 - create project on [firebase](https://console.firebase.google.com)
 - choose add firebase to my android-app
    - use `be.irceline.aqmobile` for Android-Packagename (currently - configurable in `config.xml`)
    - add the `google-services.json` which you get to `root-folder` of this project
    - build the app to test it on your device with `ionic cordova build android` (check [ionic deploying](https://ionicframework.com/docs/intro/deploying/) for additional help)

### Send notification

 - `POST` to `https://fcm.googleapis.com/fcm/send`
 - Set the following header (authorization key can be find in the settings (Cloud Messaging-tab) of the firebase project):
   - Content-Type: application/json
   - Authorization: key=AAAAinFTu0Axxxxxxxxxxxxxxxxxxxxxxxxx
 - body:
  ```javascript
  {
    "notification": {
      "title": "Title",
      "body": "Body",
      "sound": "default",
      "click_action": "FCM_PLUGIN_ACTIVITY",
      "icon": "fcm_push_icon",
      "subtitle": "subtitle"
    },
    "data": {
      "title": "Title",
      "body": "Body",
      "topic": "flanders",
      "expiration": "2018-11-08T14:00:00+01:00"
    },
    "to":"/topics/flanders",
    "priority": "high",
    "restricted_package_name": ""
  }
//sound: optional field if you want sound with the notification
//click_action: must be present with the specified value for Android
//icon: white icon resource name for Android >5.0
//data: put any "param":"value" and retreive them in the JavaScript notification callback
//to: device token or /topic/topicExample
//priority: must be set to "high" for delivering notifications on closed iOS apps
//restricted_package_name: optional field if you want to send only to a restricted app package (i.e: com.myapp.test)
```
 - full documentation: https://firebase.google.com/docs/cloud-messaging/http-server-ref

## Build prerequisites

On CentOS:
```sh
yum update -y
yum install epel-release
yum install nodejs git
node --version
```

Add the other prerequisites:
```sh
npm install -g ionic cordova
ionic cordova plugin add cordova-plugin-fcm
```

Clone the repo:
```sh
yum install git
git clone https://github.com/irceline/aq-mobile-be.git
cd aq-mobile-be
```
Do a build for `Android`:
```sh
ionic cordova build android
```

## Build quirks

 * conflict between the plugins `cordova-plugin-mauron85-background-geolocation` and `cordova-plugin-fcm`
    * In `platforms/android/cordova-plugin-fcm/*-FCMPlugin.gradle`
      * remove line `classpath 'com.google.gms:google-services:3.0.0'`
      * remove line `apply plugin: com.google.gms.googleservices.GoogleServicesPlugin`
      * add at the end `apply plugin: 'com.google.gms.google-services'`
    * Add in `build.gradle` the following line `classpath 'com.google.gms:google-services:3.2.1'` at buildscript.dependencies (ca. line 36)
    * Build with `ionic cordova build android` and you will get a version error response.
    * Change platforms/android/project.properties with your version from above output, version must be the same:
        ```
        com.google.firebase:firebase-core:xx.xx.xx
        com.google.firebase:firebase-messaging:xx.xx.xx
        com.google.android.gms:play-services-location:xx.xx.xx
        ```
    * Build again with `ionic cordova build android`
    * If you get the following error:
        ```
        Could not find support-v4.jar (com.android.support:support-v4:26.1.0).
        Searched in the following locations: https://jcenter.bintray.com/com/android/support/support-v4/26.1.0/support-v4-26.1.0.jar
        ```
      Move `jcenter()` after `maven()` in `build.gradle` as described [here](https://github.com/mauron85/react-native-background-geolocation/issues/216#issuecomment-405771704), should look like this:
        ```
        allprojects {
          repositories {
            maven {
              url "https://maven.google.com"
            }
            jcenter()
          }
        }
        ```

  * on `OSX` you will `Android Studio` and:
    * `cd ~/Library/Android/sdk/tools/bin/`
    * run `./sdkmanager --licenses` and accept all
     do above

  * If you get the following error: `Execution failed for task ':app:processDebugGoogleServices'. > Please fix the version conflict either by updating the version of the google-services plugin (information about the latest version is available at https://bintray.com/android/android-tools/com.google.gms.google-services/) or updating the version of com.google.android.gms to 10.+. `
    * adjust in `platforms/project.properties` -> `com.google.android.gms:play-services-location:15.+` to `com.google.android.gms:play-services-location:10.+`
    * adjust in `plugins/cordova-plugin-request-location-accuracy/plugin.xml` -> `com.google.android.gms:play-services-location:15.+` to `com.google.android.gms:play-services-location:10.+`
