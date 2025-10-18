package com.noteclub.app;

import android.os.Bundle;
import android.service.media.MediaBrowserService;
import android.media.browse.MediaBrowser.MediaItem;
import android.content.Intent;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import java.util.ArrayList;
import java.util.List;

public class MediaPlaybackService extends MediaBrowserService {
    private static final String MEDIA_ROOT_ID = "root";
    private static final String EMPTY_MEDIA_ROOT_ID = "empty_root";

    @Override
    public void onCreate() {
        super.onCreate();
    }

    @Nullable
    @Override
    public BrowserRoot onGetRoot(@NonNull String clientPackageName, int clientUid, @Nullable Bundle rootHints) {
        // Allow Android Auto to browse the media
        return new BrowserRoot(MEDIA_ROOT_ID, null);
    }

    @Override
    public void onLoadChildren(@NonNull String parentId, @NonNull Result<List<MediaItem>> result) {
        // Return an empty list for now - this is where you would load your albums
        List<MediaItem> mediaItems = new ArrayList<>();
        result.sendResult(mediaItems);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
    }
}
