package com.toonlira.translationgateway.application;

import java.util.ArrayList;

/**
 * Where a swallowed failure happened, safe to log: exception types along the cause chain and the first frame of this
 * application's own code. Never the message — provider and IO messages can carry page text, object keys or paths.
 */
final class FailureDiagnostics {
    private static final String OWN_PACKAGE = "com.toonlira.";
    private static final int MAX_CAUSES = 4;

    private FailureDiagnostics() { }

    static String describe(Throwable error) {
        var types = new ArrayList<String>();
        String where = null;
        for (Throwable cause = error; cause != null && types.size() < MAX_CAUSES; cause = cause.getCause()) {
            // A fixed failure code ("render-busy") is safe and says which failure it was; free text never is.
            boolean code = cause.getMessage() != null && cause.getMessage().matches("[a-z0-9]+(-[a-z0-9]+)+");
            types.add(cause.getClass().getSimpleName() + (code ? "(" + cause.getMessage() + ")" : ""));
            if (where == null) {
                for (var frame : cause.getStackTrace()) {
                    if (frame.getClassName().startsWith(OWN_PACKAGE)) {
                        String type = frame.getClassName().substring(frame.getClassName().lastIndexOf('.') + 1);
                        where = type + "." + frame.getMethodName() + ":" + frame.getLineNumber();
                        break;
                    }
                }
            }
        }
        return String.join(" <- ", types) + (where == null ? "" : " at " + where);
    }
}
