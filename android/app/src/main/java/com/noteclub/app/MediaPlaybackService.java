package com.noteclub.app;

import android.os.Bundle;
import android.service.media.MediaBrowserService;
import android.media.browse.MediaBrowser.MediaItem;
import android.media.MediaDescription;
import android.media.session.MediaSession;
import android.content.Intent;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import java.util.ArrayList;
import java.util.List;

public class MediaPlaybackService extends MediaBrowserService {
    private static final String TAG = "MediaPlaybackService";
    private static final String MEDIA_ROOT_ID = "root";
    private static final String EMPTY_MEDIA_ROOT_ID = "empty_root";

    private MediaSession mSession;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "MediaPlaybackService created");

        // Create a MediaSession
        mSession = new MediaSession(this, TAG);
        setSessionToken(mSession.getSessionToken());

        // Set callback for media session events
        mSession.setCallback(new MediaSession.Callback() {
            @Override
            public void onPlay() {
                Log.d(TAG, "onPlay called");
            }

            @Override
            public void onPause() {
                Log.d(TAG, "onPause called");
            }

            @Override
            public void onStop() {
                Log.d(TAG, "onStop called");
            }
        });

        mSession.setActive(true);
    }

    @Nullable
    @Override
    public BrowserRoot onGetRoot(@NonNull String clientPackageName, int clientUid, @Nullable Bundle rootHints) {
        Log.d(TAG, "onGetRoot: clientPackageName=" + clientPackageName);
        // Allow Android Auto and other media browsers to browse the media
        return new BrowserRoot(MEDIA_ROOT_ID, null);
    }

    @Override
    public void onLoadChildren(@NonNull String parentId, @NonNull Result<List<MediaItem>> result) {
        Log.d(TAG, "onLoadChildren: parentId=" + parentId);

        // Return an empty list for now - this is where you would load your albums
        List<MediaItem> mediaItems = new ArrayList<>();

        // Example: Add a placeholder item so Android Auto can see the app
        MediaDescription.Builder builder = new MediaDescription.Builder();
        builder.setMediaId("placeholder_1");
        builder.setTitle("NoteClub");
        builder.setSubtitle("Music sharing with friends");

        MediaItem item = new MediaItem(builder.build(), MediaItem.FLAG_BROWSABLE);
        mediaItems.add(item);

        result.sendResult(mediaItems);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "onStartCommand");
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "onDestroy");
        if (mSession != null) {
            mSession.release();
        }
        super.onDestroy();
    }
}
