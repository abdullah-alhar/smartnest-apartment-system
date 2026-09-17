package com.smartnest.backend.security;

import com.smartnest.backend.model.User;
import com.smartnest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        // a null role (old seed data) would otherwise NPE into a confusing 403
        if (user.getRole() == null) {
            throw new UsernameNotFoundException(
                "User '" + email + "' has no role assigned. "
                + "Run: UPDATE users SET role='ADMIN' WHERE email='" + email + "';"
            );
        }

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())))
                // Spring Security's own pre-auth check throws DisabledException for this at login
                .disabled(!user.isActiveOrDefault())
                .build();
    }
}