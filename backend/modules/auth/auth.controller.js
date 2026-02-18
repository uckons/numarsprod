const axios = require("axios")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const db = require("../../config/db")


const isEnvFalse = (value) => ['0', 'false', 'no', 'off'].includes(String(value || '').toLowerCase())

const verifyTurnstileToken = async ({ token, remoteip }) => {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return { enabled: false, success: false }

  if (!token) {
    return { enabled: true, success: false, message: "Captcha Cloudflare wajib diisi" }
  }

  try {
    const params = new URLSearchParams()
    params.append("secret", secret)
    params.append("response", token)
    if (remoteip) params.append("remoteip", remoteip)

    const { data } = await axios.post(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      params,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 10000 }
    )

    if (!data?.success) {
      return {
        enabled: true,
        success: false,
        message: "Validasi captcha Cloudflare gagal",
        errors: Array.isArray(data?.["error-codes"]) ? data["error-codes"] : []
      }
    }

    return { enabled: true, success: true }
  } catch (error) {
    return { enabled: true, success: false, message: "Captcha Cloudflare tidak dapat diverifikasi" }
  }
}

const verifyRecaptchaStandard = async ({ token, remoteip, secret }) => {
  const params = new URLSearchParams()
  params.append("secret", secret)
  params.append("response", token)
  if (remoteip) params.append("remoteip", remoteip)

  const { data } = await axios.post(
    "https://www.google.com/recaptcha/api/siteverify",
    params,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 10000 }
  )

  if (!data?.success) {
    return {
      enabled: true,
      success: false,
      message: "Validasi Google reCAPTCHA gagal",
      errors: Array.isArray(data?.["error-codes"]) ? data["error-codes"] : []
    }
  }

  return { enabled: true, success: true }
}

const verifyRecaptchaEnterprise = async ({ token, remoteip, expectedAction }) => {
  const projectId = process.env.RECAPTCHA_ENTERPRISE_PROJECT_ID
  const apiKey = process.env.RECAPTCHA_ENTERPRISE_API_KEY
  const siteKey = process.env.RECAPTCHA_SITE_KEY || process.env.VITE_RECAPTCHA_SITE_KEY

  if (!projectId || !apiKey) {
    return { enabled: false, success: false }
  }

  if (!siteKey) {
    return {
      enabled: true,
      success: false,
      message: "RECAPTCHA_SITE_KEY belum dikonfigurasi di backend",
      errors: ["missing_site_key"]
    }
  }

  const payload = {
    event: {
      token,
      siteKey,
      userIpAddress: remoteip || undefined,
      expectedAction: expectedAction || undefined
    }
  }

  try {
    const { data } = await axios.post(
      `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`,
      payload,
      { timeout: 10000 }
    )

    const valid = Boolean(data?.tokenProperties?.valid)
    const invalidReason = data?.tokenProperties?.invalidReason

    if (!valid) {
      return {
        enabled: true,
        success: false,
        message: "Validasi Google reCAPTCHA Enterprise gagal",
        errors: invalidReason ? [String(invalidReason)] : []
      }
    }

    const action = data?.tokenProperties?.action || ""
    if (expectedAction && action && action !== expectedAction) {
      return {
        enabled: true,
        success: false,
        message: "Aksi reCAPTCHA tidak sesuai",
        errors: [`expected:${expectedAction}`, `actual:${action}`]
      }
    }

    const minScore = Number(process.env.RECAPTCHA_MIN_SCORE || 0)
    const score = Number(data?.riskAnalysis?.score || 0)
    if (Number.isFinite(minScore) && minScore > 0 && score < minScore) {
      return {
        enabled: true,
        success: false,
        message: "Skor reCAPTCHA terlalu rendah",
        errors: [`score:${score}`, `min:${minScore}`]
      }
    }

    return { enabled: true, success: true }
  } catch (error) {
    const googleMessage = error?.response?.data?.error?.message || ""
    const googleStatus = error?.response?.data?.error?.status || ""

    if (googleStatus === "PERMISSION_DENIED" && /referer/i.test(googleMessage)) {
      return {
        enabled: true,
        success: false,
        message: "Google reCAPTCHA Enterprise ditolak: API key diblokir oleh restriction referer",
        errors: [
          googleStatus,
          googleMessage,
          "Gunakan API key backend (IP/server restricted, bukan HTTP referer) atau nonaktifkan enterprise via RECAPTCHA_ENTERPRISE_ENABLED=false"
        ].filter(Boolean)
      }
    }

    return {
      enabled: true,
      success: false,
      message: "Google reCAPTCHA Enterprise tidak dapat diverifikasi",
      errors: [googleStatus, googleMessage].filter(Boolean)
    }
  }
}

const verifyRecaptchaToken = async ({ token, remoteip, expectedAction }) => {
  const secret = process.env.RECAPTCHA_SECRET_KEY
  const enterpriseConfigured = Boolean(process.env.RECAPTCHA_ENTERPRISE_PROJECT_ID && process.env.RECAPTCHA_ENTERPRISE_API_KEY)
  const enterpriseEnabled = enterpriseConfigured && !isEnvFalse(process.env.RECAPTCHA_ENTERPRISE_ENABLED)

  if (!secret && !enterpriseEnabled) return { enabled: false, success: false }

  if (!token) {
    return { enabled: true, success: false, message: "Google reCAPTCHA wajib diisi" }
  }

  if (enterpriseEnabled) {
    const enterpriseResult = await verifyRecaptchaEnterprise({ token, remoteip, expectedAction })
    if (enterpriseResult.success || !secret) return enterpriseResult
    // fallback ke reCAPTCHA standard jika enterprise gagal tetapi secret standard tersedia
    try {
      const standardResult = await verifyRecaptchaStandard({ token, remoteip, secret })
      if (standardResult.success) return standardResult
      return {
        enabled: true,
        success: false,
        message: enterpriseResult.message,
        errors: [...(enterpriseResult.errors || []), ...(standardResult.errors || [])]
      }
    } catch (error) {
      return enterpriseResult
    }
  }

  if (secret) {
    try {
      return await verifyRecaptchaStandard({ token, remoteip, secret })
    } catch (error) {
      return { enabled: true, success: false, message: "Google reCAPTCHA tidak dapat diverifikasi" }
    }
  }

  return { enabled: true, success: false, message: "Konfigurasi reCAPTCHA belum lengkap" }
}

const verifyCaptchaToken = async ({ turnstileToken, recaptchaToken, remoteip, expectedAction }) => {
  const recaptchaEnabled = Boolean(
    process.env.RECAPTCHA_SECRET_KEY ||
    (process.env.RECAPTCHA_ENTERPRISE_PROJECT_ID && process.env.RECAPTCHA_ENTERPRISE_API_KEY)
  )
  const turnstileEnabled = Boolean(process.env.TURNSTILE_SECRET_KEY)

  if (recaptchaEnabled) {
    const recaptchaResult = await verifyRecaptchaToken({ token: recaptchaToken, remoteip, expectedAction })
    if (recaptchaResult.success) return recaptchaResult

    const recaptchaBlockedByPermission = (recaptchaResult.errors || []).some((err) => String(err).includes("PERMISSION_DENIED"))
    if (turnstileEnabled && turnstileToken && recaptchaBlockedByPermission) {
      return verifyTurnstileToken({ token: turnstileToken, remoteip })
    }

    return recaptchaResult
  }

  if (turnstileEnabled) {
    return verifyTurnstileToken({ token: turnstileToken, remoteip })
  }

  return { enabled: false, success: true }
}

exports.login = async (req, res) => {
  try {
    const { username, password, turnstile_token, recaptcha_token } = req.body

    if (!username || !password) {
      return res.status(400).json({ message: "Username & password required" })
    }

    const captchaCheck = await verifyCaptchaToken({
      turnstileToken: turnstile_token,
      recaptchaToken: recaptcha_token,
      remoteip: req.ip,
      expectedAction: "login"
    })

    if (!captchaCheck.success) {
      return res.status(400).json({
        message: captchaCheck.message,
        errors: captchaCheck.errors || []
      })
    }

    const { rows } = await db.query(
      `SELECT u.id, u.username, u.password, u.name, u.branch_id, r.name AS role, b.name AS branch_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN branches b ON b.id = u.branch_id
       WHERE u.username = $1
       LIMIT 1`,
      [username]
    )

    if (rows.length === 0) {
      return res.status(401).json({ message: "User tidak ditemukan" })
    }

    const user = rows[0]
    const match = await bcrypt.compare(password, user.password)

    if (!match) {
      return res.status(401).json({ message: "Password salah" })
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        name: user.name,
        branch_id: user.branch_id
      },
      process.env.JWT_SECRET || "NUMARS_SUPER_SECRET",
      { expiresIn: "24h" }
    )

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name || null,
        role: user.role,
        branch_id: user.branch_id || null,
        branch_name: user.branch_name || null
      }
    })
  } catch (err) {
    console.error("LOGIN ERROR:", err)
    res.status(500).json({ message: "Login error" })
  }
}
