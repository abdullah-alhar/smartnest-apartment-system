package com.smartnest.backend.model;

/** Where apartment photos live on disk and how the browser reaches them. */
public final class ApartmentImages {

    /** Sub-folder of the upload directory; only this folder is served publicly. */
    public static final String FOLDER = "apartment-images";

    /** Public URL prefix (served by WebConfig). */
    public static final String URL_PREFIX = "/uploads/" + FOLDER + "/";

    private ApartmentImages() {}

    public static String urlFor(String imagePath) {
        if (imagePath == null) return null;
        return URL_PREFIX + imagePath.substring(imagePath.lastIndexOf('/') + 1);
    }
}
