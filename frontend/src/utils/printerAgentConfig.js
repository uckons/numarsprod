const STORAGE_KEY = "numars_printer_agent_config"

const defaultConfig = {
  agent_url: "",
  agent_token: "",
  agent_printer_name: ""
}

export function getPrinterAgentConfig () {
  if (typeof window === "undefined") return { ...defaultConfig }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultConfig }
    const parsed = JSON.parse(raw)

    return {
      agent_url: String(parsed?.agent_url || "").trim(),
      agent_token: String(parsed?.agent_token || "").trim(),
      agent_printer_name: String(parsed?.agent_printer_name || "").trim()
    }
  } catch (err) {
    console.warn("Failed reading printer agent config", err)
    return { ...defaultConfig }
  }
}

export function setPrinterAgentConfig (config = {}) {
  if (typeof window === "undefined") return

  const normalized = {
    agent_url: String(config?.agent_url || "").trim(),
    agent_token: String(config?.agent_token || "").trim(),
    agent_printer_name: String(config?.agent_printer_name || "").trim()
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
}
