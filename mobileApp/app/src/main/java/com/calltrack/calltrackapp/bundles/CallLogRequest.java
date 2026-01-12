package com.calltrack.calltrackapp.bundles;

import java.util.List;

public class CallLogRequest {
    public List<CallLogItem> logs;

    public CallLogRequest(List<CallLogItem> logs) {
        this.logs = logs;
    }
}
