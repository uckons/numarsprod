const axios = require("axios")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const db = require("../../config/db")


const verifyTurnstileToken = async ({ token, remoteip }) => {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return { enabled: false, success: true }

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


exports.login = async (req, res) => {
  try {
    const { username, password, turnstile_token } = req.body

    if (!username || !password) {
      return res.status(400).json({ message: "Username & password required" })
    }

    const captchaCheck = await verifyTurnstileToken({
      token: turnstile_token,
      remoteip: req.ip
    })
    if (!captchaCheck.success) {
      return res.status(400).json({
        message: captchaCheck.message,
        errors: captchaCheck.errors || []
      })
    }

    // Ambil juga nama user dan nama branch (jika ada)
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

    // Kembalikan user object lengkap agar frontend punya name & branch_name
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