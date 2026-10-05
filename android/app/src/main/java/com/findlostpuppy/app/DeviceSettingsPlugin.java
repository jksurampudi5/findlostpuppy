package com.findlostpuppy.app;

import android.content.Intent;
import android.content.IntentSender;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.common.api.ResolvableApiException;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.LocationSettingsRequest;
import com.google.android.gms.location.Priority;
import com.google.android.gms.location.SettingsClient;

@CapacitorPlugin(name = "DeviceSettings")
public class DeviceSettingsPlugin extends Plugin {

    @PluginMethod
    public void promptEnableLocation(PluginCall call) {
        try {
            LocationRequest locationRequest = new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 10000L)
                    .setMinUpdateIntervalMillis(5000L)
                    .build();

            LocationSettingsRequest request = new LocationSettingsRequest.Builder()
                    .addLocationRequest(locationRequest)
                    .setAlwaysShow(true)
                    .build();

            SettingsClient client = LocationServices.getSettingsClient(getActivity());
            client.checkLocationSettings(request)
                    .addOnSuccessListener(response -> {
                        JSObject result = new JSObject();
                        result.put("resolved", true);
                        result.put("alreadyEnabled", true);
                        call.resolve(result);
                    })
                    .addOnFailureListener(exception -> {
                        if (exception instanceof ResolvableApiException) {
                            try {
                                ((ResolvableApiException) exception).startResolutionForResult(getActivity(), 9207);
                                JSObject result = new JSObject();
                                result.put("resolved", true);
                                result.put("alreadyEnabled", false);
                                call.resolve(result);
                            } catch (IntentSender.SendIntentException sendEx) {
                                call.reject("Unable to show Android Location enable dialog", sendEx);
                            }
                        } else {
                            call.reject("Android Location settings are unavailable", exception);
                        }
                    });
        } catch (Exception ex) {
            call.reject("Unable to prompt for Android Location", ex);
        }
    }
    @PluginMethod
    public void openLocationSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);

            JSObject result = new JSObject();
            result.put("opened", true);
            call.resolve(result);
        } catch (Exception ex) {
            call.reject("Unable to open Android Location settings", ex);
        }
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(android.net.Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);

            JSObject result = new JSObject();
            result.put("opened", true);
            call.resolve(result);
        } catch (Exception ex) {
            call.reject("Unable to open Android app settings", ex);
        }
    }
}
