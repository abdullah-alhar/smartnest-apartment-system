// DESIGN PATTERN: Factory (Creational) - this class is the Factory

package com.smartnest.backend.factory;

import com.smartnest.backend.model.Admin;
import com.smartnest.backend.model.CRO;
import com.smartnest.backend.model.MarketingExecutive;
import com.smartnest.backend.model.OperationalManager;
import com.smartnest.backend.model.Role;
import com.smartnest.backend.model.SalesStaff;
import com.smartnest.backend.model.Staff;
import org.springframework.stereotype.Component;

/**
 * Creates the right kind of Staff object for a role.
 *
 * The caller (AdminController) only asks for "a Staff for this role" and gets back the correct
 * subclass. It never uses "new Admin()", "new CRO()" etc. itself, so adding a new staff type
 * only means changing this one class.
 */
@Component
public class StaffFactory {

    public Staff create(Role role) {
        if (role == null) {
            throw new IllegalArgumentException("Invalid staff role");
        }
        return switch (role) {
            case ADMIN -> new Admin();
            case CRO -> new CRO();
            case SALES_STAFF -> new SalesStaff();
            case OPERATIONS_MANAGER -> new OperationalManager();
            case MARKETING_EXECUTIVE -> new MarketingExecutive();
            default -> throw new IllegalArgumentException("Invalid staff role");
        };
    }
}
