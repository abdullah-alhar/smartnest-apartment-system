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
                        // preflight OPTIONS has no auth header, so it must be allowed through or every cross-origin POST/PUT fails
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Auth is open to everyone
                        .requestMatchers("/api/auth/**").permitAll()

                        // GET /api/promotions (approved list) is fully public
                        .requestMatchers(HttpMethod.GET, "/api/promotions").permitAll()

                        // Only SALES_STAFF / ADMIN may POST a promotion
                        .requestMatchers(HttpMethod.POST, "/api/promotions").hasAnyRole("SALES_STAFF", "ADMIN")

                        // Approve/reject endpoints — OPERATIONS_MANAGER, ADMIN (Admin is a super-role)
                        .requestMatchers("/api/promotions/*/approve").hasAnyRole("OPERATIONS_MANAGER", "ADMIN")
                        .requestMatchers("/api/promotions/*/reject").hasAnyRole("OPERATIONS_MANAGER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/promotions/pending").hasAnyRole("OPERATIONS_MANAGER", "ADMIN")

                        // Admin management endpoints
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // Everything else just needs a valid JWT
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

    // wired into Security's own filter chain so CORS runs before the auth checks do
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