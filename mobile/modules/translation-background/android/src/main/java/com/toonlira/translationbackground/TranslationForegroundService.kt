package com.toonlira.translationbackground

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

class TranslationForegroundService : HeadlessJsTaskService() {
  companion object {
    const val CHANNEL = "toonlira-translation"
    const val START = "com.toonlira.translation.START"
    const val STOP = "com.toonlira.translation.STOP"
    const val UPDATE = "com.toonlira.translation.UPDATE"
    const val FINISH = "com.toonlira.translation.FINISH"
    const val NOTIFICATION_ID = 6601
    const val RESULT_ID = 6602
    @Volatile var running = false
    @Volatile var stopRequested = false
    @Volatile var runId: String? = null
  }

  private var title = ""
  private var body = ""
  private var stopLabel = ""
  private var stoppingLabel = ""
  private var projectId = ""
  private var progress = 0
  private var total = 0

  private fun manager() = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

  private fun openApp(): PendingIntent {
    val intent = packageManager.getLaunchIntentForPackage(packageName) ?: Intent()
    if (projectId.matches(Regex("[0-9a-fA-F-]{36}"))) {
      intent.action = Intent.ACTION_VIEW
      intent.data = Uri.parse("toonlira://translation-reader/$projectId")
    }
    intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    return PendingIntent.getActivity(this, 6601, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  private fun notification(progress: Int, total: Int, ongoing: Boolean): android.app.Notification {
    val stopIntent = Intent(this, TranslationForegroundService::class.java).setAction(STOP)
    val stopAction = PendingIntent.getService(this, 6602, stopIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val builder = NotificationCompat.Builder(this, CHANNEL)
      .setSmallIcon(android.R.drawable.stat_sys_upload)
      .setContentTitle(if (ongoing && stopRequested) stoppingLabel else title).setContentText(if (ongoing && stopRequested) stoppingLabel else body).setOnlyAlertOnce(ongoing)
      .setOngoing(ongoing).setContentIntent(openApp()).setAutoCancel(!ongoing)
      .setPriority(NotificationCompat.PRIORITY_LOW)
    if (ongoing) {
      if (!stopRequested) builder.addAction(0, stopLabel, stopAction)
      if (total > 0) builder.setProgress(total, progress.coerceIn(0, total), false) else builder.setProgress(0, 0, true)
    }
    return builder.build()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      START -> {
        if (running) return START_NOT_STICKY
        val id = intent.getStringExtra("runId") ?: return START_NOT_STICKY
        title = intent.getStringExtra("title") ?: return START_NOT_STICKY
        body = intent.getStringExtra("body") ?: return START_NOT_STICKY
        stopLabel = intent.getStringExtra("stop") ?: return START_NOT_STICKY
        stoppingLabel = intent.getStringExtra("stopping") ?: return START_NOT_STICKY
        projectId = intent.getStringExtra("projectId") ?: return START_NOT_STICKY
        if (Build.VERSION.SDK_INT >= 26) manager().createNotificationChannel(NotificationChannel(CHANNEL, intent.getStringExtra("channel") ?: title, NotificationManager.IMPORTANCE_LOW))
        runId = id
        stopRequested = false
        progress = 0
        total = 0
        running = true
        try {
          ServiceCompat.startForeground(this, NOTIFICATION_ID, notification(0, 0, true), if (Build.VERSION.SDK_INT >= 29) ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC else 0)
          super.onStartCommand(intent, flags, startId)
        } catch (_: RuntimeException) {
          stopRequested = true
          running = false
          stopSelf()
        }
      }
      STOP -> if (running) {
        stopRequested = true
        manager().notify(NOTIFICATION_ID, notification(progress, total, true))
      } else stopSelf()
      UPDATE -> if (running && intent.getStringExtra("runId") == runId) {
        body = intent.getStringExtra("body") ?: body
        progress = intent.getIntExtra("done", 0)
        total = intent.getIntExtra("total", 0)
        manager().notify(NOTIFICATION_ID, notification(progress, total, true))
      }
      FINISH -> if (running && intent.getStringExtra("runId") == runId) {
        title = intent.getStringExtra("title") ?: title
        body = intent.getStringExtra("body") ?: body
        manager().notify(RESULT_ID, notification(0, 0, false))
        stopRequested = true
        running = false
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
        stopSelf()
      }
      else -> stopSelf()
    }
    return START_NOT_STICKY
  }

  override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
    if (intent?.action != START) return null
    return HeadlessJsTaskConfig("ToonliraTranslation", Arguments.createMap().apply { putString("runId", intent.getStringExtra("runId")) }, 0, true)
  }

  override fun onTimeout(startId: Int, fgsType: Int) {
    stopRequested = true
    running = false
    stopSelf()
  }

  override fun onDestroy() {
    stopRequested = true
    running = false
    runId = null
    super.onDestroy()
  }
}
