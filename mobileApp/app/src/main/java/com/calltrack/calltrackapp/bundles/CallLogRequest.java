package com.calltrack.calltrackapp.bundles;

import java.util.List;

public class CallLogRequest {

    public int battery_level;
    public List<CallLogItem> logs;

    public CallLogRequest(List<CallLogItem> logs) {
        this.logs = logs;
    }
}
