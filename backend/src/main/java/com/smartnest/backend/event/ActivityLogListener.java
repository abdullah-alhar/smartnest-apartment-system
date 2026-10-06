// DESIGN PATTERN: Observer (Behavioral) - this class is an Observer (listener)

package com.smartnest.backend.event;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Observer that writes one line to the backend console for every SmartNest event,
 * e.g. "[SmartNest event] Promotion #5 APPROVED".
 *
 * It listens to the common SmartNestEvent type, so it hears events from every service.
 */
@Slf4j
@Component
public class ActivityLogListener {

    @EventListener
    public void onAnyEvent(SmartNestEvent e) {
        log.info("[SmartNest event] {}", e.summary());
    }
}
