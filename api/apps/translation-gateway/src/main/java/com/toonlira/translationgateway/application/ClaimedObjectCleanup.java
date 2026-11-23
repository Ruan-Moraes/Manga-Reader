package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import java.util.List;

/** Attempts only already-claimed references; any incomplete deletion keeps the durable intent pending. */
final class ClaimedObjectCleanup {
    private ClaimedObjectCleanup() { }

    static boolean deleteAll(ObjectStoragePort storage, List<String> objectKeys) {
        boolean complete = true;
        for (var key : objectKeys) {
            try { storage.delete(key); }
            catch (RuntimeException unavailable) { complete = false; }
        }
        return complete;
    }
}
