package com.calltrack.calltrackapp.api;

import com.calltrack.calltrackapp.bundles.CallLogRequest;
import com.calltrack.calltrackapp.bundles.EventPayload;
import com.calltrack.calltrackapp.bundles.EventResponse;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.Header;
import retrofit2.http.POST;

public interface EventApi {

    @POST("v1/devices/register")
    Call<EventResponse> register(
        @Header("X-Device-Token") String token,
        @Body EventPayload request
    );

}
