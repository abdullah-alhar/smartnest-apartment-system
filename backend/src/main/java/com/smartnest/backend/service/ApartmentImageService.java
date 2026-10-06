package com.smartnest.backend.service;

import com.smartnest.backend.model.Apartment;
import com.smartnest.backend.model.ApartmentImages;
import com.smartnest.backend.repository.ApartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

/** Stores the single optional photo of an apartment listing. */
@Service
@RequiredArgsConstructor
public class ApartmentImageService {

    private static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;

    private final ApartmentRepository apartmentRepository;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    /** Saves (or replaces) the apartment's photo. Only the listing's creator or an admin may change it. */
    @Transactional
    public Apartment setImage(Long apartmentId, MultipartFile file, Long callerId, boolean isAdmin) {
        Apartment apartment = ownedApartment(apartmentId, callerId, isAdmin);
        String extension = imageExtension(file);

        String relative = ApartmentImages.FOLDER + "/" + UUID.randomUUID() + "." + extension;
        Path target = folder().resolve(relative);
        try {
            Files.createDirectories(target.getParent());
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new UncheckedIOException("Could not save the apartment photo", e);
        }

        deleteFile(apartment.getImagePath());
        apartment.setImagePath(relative);
        return apartmentRepository.save(apartment);
    }

    @Transactional
    public Apartment removeImage(Long apartmentId, Long callerId, boolean isAdmin) {
        Apartment apartment = ownedApartment(apartmentId, callerId, isAdmin);
        deleteFile(apartment.getImagePath());
        apartment.setImagePath(null);
        return apartmentRepository.save(apartment);
    }

    /** Removes the stored file; used when a listing is deleted. */
    public void deleteFile(String relativePath) {
        if (relativePath == null) return;
        try {
            Files.deleteIfExists(folder().resolve(relativePath));
        } catch (IOException ignored) {
            // A leftover file is harmless; nothing points at it any more.
        }
    }

    public Path imageFolder() {
        return folder().resolve(ApartmentImages.FOLDER);
    }

    private Apartment ownedApartment(Long apartmentId, Long callerId, boolean isAdmin) {
        Apartment apartment = apartmentRepository.findById(apartmentId)
                .orElseThrow(() -> new IllegalArgumentException("Apartment not found: " + apartmentId));
        if (!isAdmin && !Objects.equals(apartment.getCreatedByStaffId(), callerId)) {
            throw new AccessDeniedException("You can only change the photo of your own apartment listings");
        }
        return apartment;
    }

    /** Checks size and the file's real signature (not just its name) and returns jpg, png or webp. */
    private String imageExtension(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please choose a photo to upload");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new IllegalArgumentException("The photo must be 5 MB or smaller");
        }
        byte[] h = new byte[12];
        int read;
        try (InputStream in = file.getInputStream()) {
            read = in.readNBytes(h, 0, h.length);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not read the uploaded photo", e);
        }
        if (read >= 3 && (h[0] & 0xFF) == 0xFF && (h[1] & 0xFF) == 0xD8 && (h[2] & 0xFF) == 0xFF) return "jpg";
        if (read >= 8 && (h[0] & 0xFF) == 0x89 && h[1] == 'P' && h[2] == 'N' && h[3] == 'G') return "png";
        if (read >= 12 && h[0] == 'R' && h[1] == 'I' && h[2] == 'F' && h[3] == 'F'
                && h[8] == 'W' && h[9] == 'E' && h[10] == 'B' && h[11] == 'P') return "webp";
        throw new IllegalArgumentException("The photo must be a JPG, PNG or WebP image");
    }

    /** backend/uploads, whether the app is started from the backend folder or the project root (IntelliJ). */
    private Path folder() {
        Path dir = Path.of(uploadDir);
        if (!dir.isAbsolute() && Files.isDirectory(Path.of("backend", "src"))) dir = Path.of("backend").resolve(dir);
        return dir.toAbsolutePath().normalize();
    }
}
