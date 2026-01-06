package com.calltrack.calltrackapp.api;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.Strictness;

import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import retrofit2.converter.scalars.ScalarsConverterFactory;

public class ApiUtilities {
    private static final String URL = "https://api-calltrack.altalya.in/api/";
    private static Retrofit retrofit = null;

    public static DeviceApi getDeviceApi() {
        if (retrofit == null) {
            Gson gson = new GsonBuilder().setStrictness(Strictness.LENIENT).create();
            retrofit = new Retrofit.Builder().baseUrl(URL).addConverterFactory(ScalarsConverterFactory.create()).addConverterFactory(GsonConverterFactory.create(gson)).build();
        }
        return retrofit.create(DeviceApi.class);
    }

}
