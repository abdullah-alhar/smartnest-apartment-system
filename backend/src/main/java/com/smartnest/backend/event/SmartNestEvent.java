// DESIGN PATTERN: Observer (Behavioral) - the common type of every event a Subject publishes

package com.smartnest.backend.event;

/**
 * Every SmartNest event implements this, so an Observer can listen to all of them at once
 * (see ActivityLogListener).
 */
public interface SmartNestEvent {

    /** A short line describing what happened, e.g. "Promotion #5 APPROVED". */
    String summary();
}
