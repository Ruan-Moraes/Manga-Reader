package com.toonlira.translationbackground

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TranslationBackgroundModule : Module() {
  private val context: Context get() = appContext.reactContext ?: throw IllegalStateException("No Android context")

  override fun definition() = ModuleDefinition {
    Name("ToonliraTranslationBackground")

    AsyncFunction("notificationsAllowed") {
      val manager = NotificationManagerCompat.from(context)
      if (!manager.areNotificationsEnabled()) return@AsyncFunction false
      if (Build.VERSION.SDK_INT >= 26) {
        val channel = (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).getNotificationChannel(TranslationForegroundService.CHANNEL)
        if (channel != null && channel.importance == NotificationManager.IMPORTANCE_NONE) return@AsyncFunction false
      }
      true
    }

    AsyncFunction("start") { runId: String, projectId: String, title: String, body: String, stop: String, stopping: String, channel: String ->
      val intent = Intent(context, TranslationForegroundService::class.java).setAction(TranslationForegroundService.START)
        .putExtra("runId", runId).putExtra("projectId", projectId).putExtra("title", title)
        .putExtra("body", body).putExtra("stop", stop).putExtra("stopping", stopping).putExtra("channel", channel)
      ContextCompat.startForegroundService(context, intent)
      Unit
    }

    AsyncFunction("update") { runId: String, body: String, done: Int, total: Int ->
      context.startService(Intent(context, TranslationForegroundService::class.java).setAction(TranslationForegroundService.UPDATE)
        .putExtra("runId", runId).putExtra("body", body).putExtra("done", done).putExtra("total", total))
      Unit
    }

    AsyncFunction("finish") { runId: String, title: String, body: String ->
      context.startService(Intent(context, TranslationForegroundService::class.java).setAction(TranslationForegroundService.FINISH)
        .putExtra("runId", runId).putExtra("title", title).putExtra("body", body))
      Unit
    }

    AsyncFunction("state") { runId: String ->
      mapOf("running" to (TranslationForegroundService.running && TranslationForegroundService.runId == runId),
        "stopRequested" to TranslationForegroundService.stopRequested)
    }
  }
}
