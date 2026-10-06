package com.smartnest.backend.config;

import com.smartnest.backend.service.ApartmentImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Serves apartment photos publicly. Payment proofs live in a different folder and are never exposed here. */
@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final ApartmentImageService apartmentImageService;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/apartment-images/**")
                .addResourceLocations(apartmentImageService.imageFolder().toUri().toString());
    }
}
