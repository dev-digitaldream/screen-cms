package com.screeneditor.player

import androidx.appcompat.app.AppCompatActivity
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.text.InputType
import android.view.Gravity
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import android.widget.Button
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import java.util.UUID

class SetupActivity : AppCompatActivity() {

    private lateinit var etServerUrl: EditText
    private lateinit var etDeviceName: EditText
    private lateinit var btnSave: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var tvStatus: TextView

    private val BG_COLOR = Color.parseColor("#0a0a0e")
    private val SURFACE_COLOR = Color.parseColor("#111827")
    private val INDIGO_COLOR = Color.parseColor("#6366f1")
    private val INDIGO_DARK_COLOR = Color.parseColor("#4f51c8")
    private val TEXT_COLOR = Color.parseColor("#e2e8f0")
    private val TEXT_MUTED_COLOR = Color.parseColor("#94a3b8")
    private val BORDER_COLOR = Color.parseColor("#1f2937")
    private val FIELD_BG_COLOR = Color.parseColor("#0f172a")

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = BG_COLOR
        window.navigationBarColor = BG_COLOR
        buildUI()
    }

    private fun buildUI() {
        val scroll = ScrollView(this).apply {
            setBackgroundColor(BG_COLOR)
            layoutParams = FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT)
        }

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(32), dp(60), dp(32), dp(40))
            layoutParams = LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT)
        }

        // Logo area
        val logoContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT).apply {
                bottomMargin = dp(40)
            }
        }

        val tvLogo = TextView(this).apply {
            text = "📺"
            textSize = 48f
            gravity = Gravity.CENTER
        }
        logoContainer.addView(tvLogo)

        val tvTitle = TextView(this).apply {
            text = "Screen Editor Player"
            textSize = 26f
            setTextColor(TEXT_COLOR)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT).apply {
                topMargin = dp(12)
            }
        }
        logoContainer.addView(tvTitle)

        val tvSubtitle = TextView(this).apply {
            text = "Configuration initiale"
            textSize = 14f
            setTextColor(TEXT_MUTED_COLOR)
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT).apply {
                topMargin = dp(6)
            }
        }
        logoContainer.addView(tvSubtitle)
        root.addView(logoContainer)

        // Card container
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = createRoundedBackground(SURFACE_COLOR, BORDER_COLOR)
            setPadding(dp(24), dp(24), dp(24), dp(24))
            layoutParams = LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT)
        }

        // Server URL label
        val tvUrlLabel = makeLabel("URL de l'écran (copiée depuis le CMS)")
        card.addView(tvUrlLabel)

        etServerUrl = EditText(this).apply {
            hint = "https://monserveur.com/display/ecran?t=token"
            textSize = 16f
            setTextColor(TEXT_COLOR)
            setHintTextColor(Color.parseColor("#334155"))
            setBackgroundColor(FIELD_BG_COLOR)
            setPadding(dp(16), dp(14), dp(16), dp(14))
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_URI
            setSingleLine(true)
            layoutParams = LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT).apply {
                bottomMargin = dp(20)
            }
            // rounded border
            background = createRoundedBackground(FIELD_BG_COLOR, Color.parseColor("#1f2937"))
        }
        card.addView(etServerUrl)

        // Device name label
        val tvNameLabel = makeLabel("Nom de l'appareil")
        card.addView(tvNameLabel)

        val defaultName = "Android TV ${android.os.Build.MODEL}"
        etDeviceName = EditText(this).apply {
            setText(defaultName)
            textSize = 16f
            setTextColor(TEXT_COLOR)
            setHintTextColor(Color.parseColor("#334155"))
            setPadding(dp(16), dp(14), dp(16), dp(14))
            inputType = InputType.TYPE_CLASS_TEXT
            setSingleLine(true)
            layoutParams = LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT).apply {
                bottomMargin = dp(28)
            }
            background = createRoundedBackground(FIELD_BG_COLOR, Color.parseColor("#1f2937"))
        }
        card.addView(etDeviceName)

        // Status text
        tvStatus = TextView(this).apply {
            text = ""
            textSize = 13f
            setTextColor(TEXT_MUTED_COLOR)
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT).apply {
                bottomMargin = dp(16)
            }
        }
        card.addView(tvStatus)

        // Progress
        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            isIndeterminate = true
            visibility = android.view.View.GONE
            layoutParams = LinearLayout.LayoutParams(MATCH_PARENT, dp(3)).apply {
                bottomMargin = dp(12)
            }
        }
        card.addView(progressBar)

        // Button
        btnSave = Button(this).apply {
            text = "Connecter et enregistrer"
            textSize = 16f
            setTextColor(Color.WHITE)
            typeface = Typeface.DEFAULT_BOLD
            setPadding(dp(24), dp(16), dp(24), dp(16))
            layoutParams = LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT)
            background = createRoundedBackground(INDIGO_COLOR, Color.TRANSPARENT)
            setOnClickListener { handleSave() }
        }
        card.addView(btnSave)

        root.addView(card)

        // Info note
        val tvNote = TextView(this).apply {
            text = "L'appareil se connectera au serveur et s'enregistrera automatiquement. Assurez-vous que le serveur est accessible depuis ce réseau."
            textSize = 12f
            setTextColor(TEXT_MUTED_COLOR)
            gravity = Gravity.CENTER
            setPadding(dp(8), dp(20), dp(8), 0)
            layoutParams = LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT)
        }
        root.addView(tvNote)

        scroll.addView(root)
        setContentView(scroll)
    }

    private fun makeLabel(text: String): TextView {
        return TextView(this).apply {
            this.text = text
            textSize = 12f
            setTextColor(TEXT_MUTED_COLOR)
            typeface = Typeface.DEFAULT_BOLD
            setPadding(dp(2), 0, 0, dp(6))
            layoutParams = LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT)
        }
    }

    private fun createRoundedBackground(fillColor: Int, borderColor: Int): android.graphics.drawable.GradientDrawable {
        return android.graphics.drawable.GradientDrawable().apply {
            shape = android.graphics.drawable.GradientDrawable.RECTANGLE
            cornerRadius = dp(12).toFloat()
            setColor(fillColor)
            if (borderColor != Color.TRANSPARENT) {
                setStroke(dp(1), borderColor)
            }
        }
    }

    private fun handleSave() {
        val displayUrl = etServerUrl.text.toString().trim().trimEnd('/')
        val deviceName = etDeviceName.text.toString().trim()

        if (displayUrl.isEmpty()) {
            tvStatus.text = "⚠ Veuillez entrer l'URL de l'écran"
            tvStatus.setTextColor(Color.parseColor("#f59e0b"))
            return
        }
        if (!displayUrl.startsWith("http://") && !displayUrl.startsWith("https://")) {
            tvStatus.text = "⚠ L'URL doit commencer par https://"
            tvStatus.setTextColor(Color.parseColor("#f59e0b"))
            return
        }

        // Extract base server URL (scheme + host + port) for API calls
        val serverUrl = try {
            val u = java.net.URL(displayUrl)
            val port = if (u.port != -1) ":${u.port}" else ""
            "${u.protocol}://${u.host}${port}"
        } catch (e: Exception) {
            tvStatus.text = "⚠ URL invalide"
            tvStatus.setTextColor(Color.parseColor("#f59e0b"))
            return
        }
        if (deviceName.isEmpty()) {
            tvStatus.text = "⚠ Veuillez entrer un nom pour l'appareil"
            tvStatus.setTextColor(Color.parseColor("#f59e0b"))
            return
        }

        btnSave.isEnabled = false
        progressBar.visibility = android.view.View.VISIBLE
        tvStatus.text = "Connexion en cours..."
        tvStatus.setTextColor(TEXT_MUTED_COLOR)

        val deviceId = UUID.randomUUID().toString()

        Thread {
            try {
                val result = DeviceManager.register(
                    serverUrl = serverUrl,
                    deviceId = deviceId,
                    deviceName = deviceName,
                    model = android.os.Build.MODEL,
                    androidVersion = android.os.Build.VERSION.RELEASE,
                    sdkInt = android.os.Build.VERSION.SDK_INT
                )

                runOnUiThread {
                    progressBar.visibility = android.view.View.GONE
                    if (result.success) {
                        // Save to prefs
                        val prefs = getSharedPreferences("device", Context.MODE_PRIVATE)
                        prefs.edit().apply {
                            putString("serverUrl", serverUrl)
                            putString("displayUrl", displayUrl)
                            putString("deviceId", result.deviceId ?: deviceId)
                            putString("deviceName", deviceName)
                            apply()
                        }

                        DeviceManager.init(this, serverUrl, result.deviceId ?: deviceId, deviceName)

                        tvStatus.text = "✓ Enregistré avec succès !"
                        tvStatus.setTextColor(Color.parseColor("#10b981"))

                        Handler(Looper.getMainLooper()).postDelayed({
                            startActivity(
                                android.content.Intent(this, MainActivity::class.java).apply {
                                    flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or
                                            android.content.Intent.FLAG_ACTIVITY_CLEAR_TASK
                                }
                            )
                            finish()
                        }, 1000)
                    } else {
                        btnSave.isEnabled = true
                        tvStatus.text = "✗ Erreur: ${result.error ?: "Impossible de joindre le serveur"}"
                        tvStatus.setTextColor(Color.parseColor("#ef4444"))
                    }
                }
            } catch (e: Exception) {
                runOnUiThread {
                    progressBar.visibility = android.view.View.GONE
                    btnSave.isEnabled = true
                    tvStatus.text = "✗ Erreur réseau: ${e.message}"
                    tvStatus.setTextColor(Color.parseColor("#ef4444"))
                }
            }
        }.start()
    }

    private fun dp(value: Int): Int {
        return (value * resources.displayMetrics.density).toInt()
    }
}
