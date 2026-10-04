package com.smartnest.backend.config;

import com.smartnest.backend.model.Admin;
import com.smartnest.backend.model.Role;
import com.smartnest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.existsByEmail("admin@smartnest.com")) {
            return;
        }

        Admin admin = new Admin();
        admin.setFirstName("System");
        admin.setLastName("Admin");
        admin.setEmail("admin@smartnest.com");
        admin.setPassword(passwordEncoder.encode("Admin@123"));
        admin.setContactNumber("0000000000");
        admin.setRole(Role.ADMIN);
        admin.setDepartment("Administration");

        userRepository.save(admin);
        System.out.println("Default Admin account created: admin@smartnest.com / Admin@123");
    }
}