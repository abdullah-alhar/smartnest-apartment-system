package com.smartnest.backend.config;

import com.smartnest.backend.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/uploads/apartment-images/**").permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/promotions").permitAll()

                        .requestMatchers(HttpMethod.POST, "/api/promotions").hasAnyRole("SALES_STAFF", "OPERATIONS_MANAGER", "ADMIN")

                        .requestMatchers("/api/promotions/*/approve").hasAnyRole("OPERATIONS_MANAGER", "ADMIN")
                        .requestMatchers("/api/promotions/*/reject").hasAnyRole("OPERATIONS_MANAGER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/promotions/pending").hasAnyRole("OPERATIONS_MANAGER", "ADMIN")

                        .requestMatchers(HttpMethod.GET, "/api/apartments/pending").hasAnyRole("OPERATIONS_MANAGER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/apartments", "/api/apartments/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/apartments/*/similar").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/apartments/*/manage").hasAnyRole("SALES_STAFF", "OPERATIONS_MANAGER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/apartments").hasAnyRole("SALES_STAFF", "OPERATIONS_MANAGER", "ADMIN")
                        .requestMatchers("/api/apartments/*/approve").hasAnyRole("OPERATIONS_MANAGER", "ADMIN")
                        .requestMatchers("/api/apartments/*/reject").hasAnyRole("OPERATIONS_MANAGER", "ADMIN")
                        .requestMatchers("/api/apartments/*/mark-sold").hasAnyRole("OPERATIONS_MANAGER", "ADMIN")

                        .requestMatchers(HttpMethod.GET, "/api/inquiries/new").hasAnyRole("CRO", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/inquiries").hasAnyRole("CRO", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/inquiries").hasRole("CUSTOMER")
                        .requestMatchers("/api/inquiries/*/claim").hasAnyRole("CRO", "ADMIN")
                        .requestMatchers("/api/inquiries/*/respond").hasAnyRole("CRO", "ADMIN")
                        .requestMatchers("/api/inquiries/*/close").hasAnyRole("CRO", "ADMIN")

                        .requestMatchers(HttpMethod.GET, "/api/appointments/pending").hasAnyRole("CRO", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/appointments").hasRole("CUSTOMER")
                        .requestMatchers("/api/appointments/*/approve").hasAnyRole("CRO", "ADMIN")
                        .requestMatchers("/api/appointments/*/reschedule").hasAnyRole("CRO", "ADMIN")
                        .requestMatchers("/api/appointments/*/decline").hasAnyRole("CRO", "ADMIN")
                        .requestMatchers("/api/appointments/*/complete").hasAnyRole("CRO", "ADMIN")
                        .requestMatchers("/api/appointments/*/cancel").hasRole("CUSTOMER")

                        .requestMatchers(HttpMethod.GET, "/api/reservations/pending").hasAnyRole("OPERATIONS_MANAGER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/reservations").hasRole("CUSTOMER")
                        .requestMatchers("/api/reservations/*/approve").hasAnyRole("OPERATIONS_MANAGER", "ADMIN")
                        .requestMatchers("/api/reservations/*/reject").hasAnyRole("OPERATIONS_MANAGER", "ADMIN")
                        .requestMatchers("/api/reservations/*/cancel").hasRole("CUSTOMER")

                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
        configuration.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
