package com.calltrack.calltrackapp.api;

import com.calltrack.calltrackapp.bundles.CallLogRequest;
import com.calltrack.calltrackapp.bundles.CallLogResponse;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.Header;
import retrofit2.http.POST;

public interface CallLogsApi {
    @POST("v1/call-logs/sync")
    Call<CallLogResponse> syncCallLogs(
        @Header("X-Device-Token") String token,
        @Body CallLogRequest payload
    );
}
