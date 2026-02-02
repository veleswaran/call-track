package com.calltrack.calltrackapp.bundles;

import java.util.List;

public class RegistrationRequest {
    public String code;
    public String device_uuid;
    public String device_name;
    public String device_model;
    public String os_version;
    public String app_version;
    public List<Integer> tracked_sim_slots;

    public RegistrationRequest(String code, String uuid, String name,
                               String model, String os, String appVersion, List<Integer> slots) {
        this.code = code;
        this.device_uuid = uuid;
        this.device_name = name;
        this.device_model = model;
        this.os_version = os;
        this.app_version = appVersion;
        this.tracked_sim_slots = slots;
    }
}
