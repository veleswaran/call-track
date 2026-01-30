package com.calltrack.calltrackapp.api;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.Strictness;

import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import retrofit2.converter.scalars.ScalarsConverterFactory;

public class ApiUtilities {
    private static final String URL = "http://192.168.0.114:8000/api/";
    private static Retrofit retrofit = null;

    public static DeviceApi getDeviceApi() {
        if (retrofit == null) {
            Gson gson = new GsonBuilder().setStrictness(Strictness.LENIENT).create();
            retrofit = new Retrofit.Builder().baseUrl(URL).addConverterFactory(ScalarsConverterFactory.create()).addConverterFactory(GsonConverterFactory.create(gson)).build();
        }
        return retrofit.create(DeviceApi.class);
    }

    public static CallLogsApi getCallLogsApi() {
        if (retrofit == null) {
            Gson gson = new GsonBuilder().setStrictness(Strictness.LENIENT).create();
            retrofit = new Retrofit.Builder().baseUrl(URL).addConverterFactory(ScalarsConverterFactory.create()).addConverterFactory(GsonConverterFactory.create(gson)).build();
        }
        return retrofit.create(CallLogsApi.class);
    }

    public static EventApi getEventApi() {
        if (retrofit == null) {
            Gson gson = new GsonBuilder().setStrictness(Strictness.LENIENT).create();
            retrofit = new Retrofit.Builder().baseUrl(URL).addConverterFactory(ScalarsConverterFactory.create()).addConverterFactory(GsonConverterFactory.create(gson)).build();
        }
        return retrofit.create(EventApi.class);
    }

}
