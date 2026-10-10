package com.findlostpuppy.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.IntentSender;
import android.location.LocationManager;
import android.os.Build;
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

    private static final int REQUEST_CODE_ENABLE_LOCATION = 9207;

    private boolean isLocationEnabledInternal() {
        try {
            LocationManager locationManager = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
            if (locationManager == null) {
                return false;
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                return locationManager.isLocationEnabled();
            } else {
                return locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
                       locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
            }
        } catch (Exception e) {
            return false;
        }
    }

    @PluginMethod
    public void isLocationEnabled(PluginCall call) {
        try {
            boolean isEnabled = isLocationEnabledInternal();
            JSObject result = new JSObject();
            result.put("enabled", isEnabled);
            call.resolve(result);
        } catch (Exception ex) {
            JSObject fallback = new JSObject();
            fallback.put("enabled", false);
            call.resolve(fallback);
        }
    }

    @PluginMethod
    public void promptEnableLocation(PluginCall call) {
        try {
            if (isLocationEnabledInternal()) {
                JSObject result = new JSObject();
                result.put("resolved", true);
                result.put("enabled", true);
                result.put("alreadyEnabled", true);
                result.put("status", "already_enabled");
                call.resolve(result);
                return;
            }

            Activity activity = getActivity();
            if (activity == null || activity.isFinishing() || activity.isDestroyed()) {
                JSObject result = new JSObject();
                result.put("resolved", false);
                result.put("enabled", false);
                result.put("status", "unavailable");
                call.resolve(result);
                return;
            }

            LocationRequest locationRequest = new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 10000L)
                    .setMinUpdateIntervalMillis(5000L)
                    .build();

            LocationSettingsRequest request = new LocationSettingsRequest.Builder()
                    .addLocationRequest(locationRequest)
                    .setAlwaysShow(true)
                    .build();

            SettingsClient client = LocationServices.getSettingsClient(activity);
            client.checkLocationSettings(request)
                    .addOnSuccessListener(response -> {
                        boolean enabled = isLocationEnabledInternal();
                        JSObject result = new JSObject();
                        result.put("resolved", true);
                        result.put("enabled", enabled);
                        result.put("alreadyEnabled", true);
                        result.put("status", enabled ? "already_enabled" : "failed_to_enable");
                        call.resolve(result);
                    })
                    .addOnFailureListener(exception -> {
                        if (exception instanceof ResolvableApiException) {
                            try {
                                PluginCall existingCall = getSavedCall();
                                if (existingCall != null) {
                                    JSObject cancelOld = new JSObject();
                                    cancelOld.put("resolved", false);
                                    cancelOld.put("enabled", false);
                                    cancelOld.put("status", "cancelled");
                                    existingCall.resolve(cancelOld);
                                    freeSavedCall();
                                }
                                saveCall(call);
                                ((ResolvableApiException) exception).startResolutionForResult(activity, REQUEST_CODE_ENABLE_LOCATION);
                            } catch (IntentSender.SendIntentException sendEx) {
                                freeSavedCall();
                                JSObject result = new JSObject();
                                result.put("resolved", false);
                                result.put("enabled", false);
                                result.put("status", "launch_failed");
                                call.resolve(result);
                            } catch (Exception ex) {
                                freeSavedCall();
                                JSObject result = new JSObject();
                                result.put("resolved", false);
                                result.put("enabled", false);
                                result.put("status", "launch_failed");
                                call.resolve(result);
                            }
                        } else {
                            JSObject result = new JSObject();
                            result.put("resolved", false);
                            result.put("enabled", false);
                            result.put("status", "unavailable");
                            call.resolve(result);
                        }
                    });
        } catch (Exception ex) {
            JSObject result = new JSObject();
            result.put("resolved", false);
            result.put("enabled", false);
            result.put("status", "error");
            call.resolve(result);
        }
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_CODE_ENABLE_LOCATION) {
            PluginCall savedCall = getSavedCall();
            if (savedCall != null) {
                JSObject result = new JSObject();
                if (resultCode == Activity.RESULT_OK) {
                    boolean actuallyEnabled = isLocationEnabledInternal();
                    result.put("resolved", actuallyEnabled);
                    result.put("enabled", actuallyEnabled);
                    result.put("status", actuallyEnabled ? "enabled" : "failed_to_enable");
                } else if (resultCode == Activity.RESULT_CANCELED) {
                    result.put("resolved", false);
                    result.put("enabled", false);
                    result.put("status", "cancelled");
                } else {
                    result.put("resolved", false);
                    result.put("enabled", false);
                    result.put("status", "dismissed");
                }
                savedCall.resolve(result);
                freeSavedCall();
            }
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
            JSObject result = new JSObject();
            result.put("opened", false);
            result.put("error", ex.getMessage());
            call.resolve(result);
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
            JSObject result = new JSObject();
            result.put("opened", false);
            result.put("error", ex.getMessage());
            call.resolve(result);
        }
    }
}
