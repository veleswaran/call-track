package com.calltrack.calltrackapp.api;
import com.calltrack.calltrackapp.bundles.FcmTokenRequest;
import com.calltrack.calltrackapp.bundles.FcmTokenResponse;
import com.calltrack.calltrackapp.bundles.RegistrationRequest;
import com.calltrack.calltrackapp.bundles.RegistrationResponse;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.Header;
import retrofit2.http.POST;

public interface  DeviceApi {
    @POST("v1/devices/register")
    Call<RegistrationResponse> register(@Body RegistrationRequest request);

    @POST("v1/device/fcm-token")
    Call<FcmTokenResponse> sendFcmToken(@Header("X-Device-Token") String token, @Body FcmTokenRequest request);
}
