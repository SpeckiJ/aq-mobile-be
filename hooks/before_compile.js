var fs = require('fs');

module.exports = function (context) {
    console.log('Adjustments before compile');

    // remove add plugin in google-services file
    var servicesFile = 'platforms/android/cordova-support-google-services/aqmobile-build.gradle';
    fs.access(servicesFile, fs.constants.F_OK, (err) => {
        if (err) {
            console.error(err);
            return;
        }
        fs.readFile(servicesFile, 'utf-8', function (err, data) {
            if (err) console.error(err);
            data = data.replace('apply plugin: com.google.gms.googleservices.GoogleServicesPlugin', '');
            fs.writeFile(servicesFile, data, 'utf-8', function (err) {
                if (err) console.error(err);
            });
        });
    });

    // adjust version in project properties
    var projectProperties = 'platforms/android/project.properties';
    fs.access(projectProperties, fs.constants.F_OK, (err) => {
        if (err) {
            console.error(err);
            return;
        }
        fs.readFile(projectProperties, 'utf-8', function (err, data) {
            if (err) console.error(err);
            data = data.replace('com.google.firebase:firebase-core:10.+', 'com.google.firebase:firebase-core:15.+');
            data = data.replace('com.google.firebase:firebase-messaging:10.+', 'com.google.firebase:firebase-messaging:15.+');
            data = data.replace('com.google.firebase:firebase-core:15.0.+', 'com.google.firebase:firebase-core:15.+');
            fs.writeFile(projectProperties, data, 'utf-8', function (err) {
                if (err) console.error(err);
            });
        });
    });

    // adjust version in project properties
    var fcmPlugin = 'platforms/android/cordova-plugin-fcm-with-dependecy-updated/aqmobile-FCMPlugin.gradle';
    fs.access(fcmPlugin, fs.constants.F_OK, (err) => {
        if (err) {
            console.error(err);
            return;
        }
        fs.readFile(fcmPlugin, 'utf-8', function (err, data) {
            if (err) console.error(err);
            data = data.replace('com.google.firebase:firebase-core:10.+', 'com.google.firebase:firebase-core:15.+');
            fs.writeFile(fcmPlugin, data, 'utf-8', function (err) {
                if (err) console.error(err);
            });
        });
    });


};