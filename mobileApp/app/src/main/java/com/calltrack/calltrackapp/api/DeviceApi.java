package com.calltrack.calltrackapp.api;
import com.calltrack.calltrackapp.bundles.RegistrationRequest;
import com.calltrack.calltrackapp.bundles.RegistrationResponse;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.POST;

public interface  DeviceApi {
    @POST("v1/devices/register")
    Call<RegistrationResponse> register(@Body RegistrationRequest request);
}
