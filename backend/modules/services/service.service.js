const db = require("../../config/db")

const resolvePackageGroupConfig = async (branchId, packageGroup) => {
  if (!packageGroup) return null
  const { rows } = await db.query(
    `SELECT package_qty, package_price, package_name
     FROM fnb_items
     WHERE branch_id=$1
       AND package_group=$2
       AND is_package=true
     ORDER BY id DESC
     LIMIT 1`,
    [branchId, packageGroup]
  )
  return rows[0] || null
}

exports.list = async ({ branch_id, type, is_active }) => {
  const params = []
  let where = "s.deleted_at IS NULL"

  if (branch_id) {
    params.push(branch_id)
    where += ` AND s.branch_id = $${params.length}`
  }

  if (type) {
    params.push(type)
    where += ` AND s.type = $${params.length}`
  }

  if (is_active !== undefined) {
    const activeValue = is_active === true || is_active === 'true' || is_active === 1 || is_active === '1'
    params.push(activeValue)
    where += ` AND s.is_active = $${params.length}`
  }

  const { rows } = await db.query(`
    SELECT
      s.id,
      s.name,
      s.type,
      CASE
        WHEN s.type = 'FNB'
          AND COALESCE(fi.is_package, false) = true
        THEN COALESCE(fi.price, s.base_price)
        WHEN s.type = 'FNB'
          AND fi.is_beverage = true
          AND COALESCE(fi.is_package, false) = false
          AND fi.happy_hour_enabled = true
          AND fi.happy_hour_price IS NOT NULL
          AND fi.happy_hour_price <> COALESCE(fi.price, s.base_price)
          AND hh_active.active = true
        THEN fi.happy_hour_price
        WHEN s.type IN ('SPA', 'LC', 'LOUNGE')
          AND s.happy_hour_enabled = true
          AND s.happy_hour_price IS NOT NULL
          AND hh_active.active = true
        THEN s.happy_hour_price
        ELSE COALESCE(fi.price, s.base_price)
      END AS base_price,
      CASE
        WHEN COALESCE(fi.is_package, false) = true THEN 'PAKET'
        WHEN s.type = 'FNB'
          AND fi.is_beverage = true
          AND COALESCE(fi.is_package, false) = false
          AND fi.happy_hour_enabled = true
          AND fi.happy_hour_price IS NOT NULL
          AND fi.happy_hour_price <> COALESCE(fi.price, s.base_price)
          AND hh_active.active = true
        THEN 'HH'
        WHEN s.type = 'FNB' AND fi.is_beverage = true THEN 'NON HH'
        ELSE NULL
      END AS price_label,
      COALESCE(fi.is_package, false) AS is_package,
      fi.package_qty,
      fi.package_group,
      COALESCE(fi.item_group, 'NORMAL') AS item_group,
      COALESCE(fi.package_special, false) AS package_special,
      fi.package_price,
      fi.package_name,
      COALESCE(fi.price, s.base_price) AS sell_price,
      s.duration_minutes,
      s.is_active,
      CASE WHEN s.type = 'FNB' THEN COALESCE(fi.happy_hour_enabled, false) ELSE s.happy_hour_enabled END AS happy_hour_enabled,
      CASE WHEN s.type = 'FNB' THEN fi.happy_hour_price ELSE s.happy_hour_price END AS happy_hour_price,
      b.name AS branch
    FROM services s
    JOIN branches b ON b.id = s.branch_id
    LEFT JOIN fnb_items fi ON fi.service_id = s.id
    LEFT JOIN LATERAL (
      SELECT true AS active
      FROM happy_hours hh
      WHERE hh.branch_id = s.branch_id
        AND hh.is_active = true
        AND (
          (
            hh.start_time <= hh.end_time
            AND (timezone('Asia/Jakarta', now()))::time BETWEEN hh.start_time AND hh.end_time
          )
          OR (
            hh.start_time > hh.end_time
            AND (
              (timezone('Asia/Jakarta', now()))::time >= hh.start_time
              OR (timezone('Asia/Jakarta', now()))::time <= hh.end_time
            )
          )
        )
        AND (
          hh.service_type IS NULL
          OR hh.service_type = s.type::text
          OR hh.service_type = 'ALL'
          OR (hh.service_type = 'LC' AND s.type = 'LOUNGE')
          OR (hh.service_type = 'LOUNGE' AND s.type = 'LC')
        )
      LIMIT 1
    ) hh_active ON true
    WHERE ${where}
    ORDER BY s.id DESC
  `, params)

  return rows
}

exports.create = async (data, actor) => {
  const {
    branch_id,
    type,
    name,
    base_price,
    duration_minutes,
    is_active = true,
    happy_hour_enabled = false,
    happy_hour_price = null,
    package_special = false,
    package_group = null
  } = data

  if (!branch_id || !type || !name) {
    throw new Error("Missing required fields")
  }

  await db.query("BEGIN")
  try {
    const serviceRes = await db.query(
      `INSERT INTO services (branch_id, type, name, base_price, duration_minutes, is_active, happy_hour_enabled, happy_hour_price)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, branch_id`,
      [
        Number(branch_id),
        type,
        name,
        Number(base_price || 0),
        duration_minutes || null,
        is_active,
        Boolean(happy_hour_enabled),
        happy_hour_price ?? null
      ]
    )

    const created = serviceRes.rows[0]

    if (type === "FNB") {
      const pkgCfg = await resolvePackageGroupConfig(created.branch_id, package_group)
      if (Boolean(package_special) && !pkgCfg) {
        throw new Error("Group paket tidak valid atau belum punya konfigurasi paket (qty/harga)")
      }
      const fnbPayload = [
        created.branch_id,
        created.id,
        name,
        Number(base_price || 0),
        Boolean(package_special),
        pkgCfg?.package_qty ?? null,
        package_group || null,
        Boolean(package_special),
        pkgCfg?.package_price ?? null,
        pkgCfg?.package_name ?? name
      ]
      const updated = await db.query(
        `UPDATE fnb_items
         SET name=$3,
             price=$4,
             is_package=$5,
             package_qty=$6,
             package_group=$7,
             package_special=$8,
             package_price=$9,
             package_name=$10
         WHERE service_id=$2`,
        fnbPayload
      )
      if (!updated.rowCount) {
        await db.query(
          `INSERT INTO fnb_items
           (branch_id, service_id, name, cost_price, price, stock, alert_stock, is_beverage, happy_hour_enabled, happy_hour_price, is_package, package_qty, package_group, item_group, package_special, package_price, package_name)
           VALUES ($1,$2,$3,0,$4,0,0,true,false,NULL,$5,$6,$7,'NORMAL',$8,$9,$10)`,
          fnbPayload
        )
      }
    }

    await db.query("COMMIT")
  } catch (err) {
    await db.query("ROLLBACK")
    throw err
  }
}

exports.update = async (id, data) => {
  const existingRes = await db.query(
    `SELECT id, branch_id, type, base_price FROM services WHERE id=$1`,
    [id]
  )

  if (!existingRes.rows.length) {
    throw new Error("Service not found")
  }

  const existing = existingRes.rows[0]
  const nextType = data.type || existing.type
  const keepFnbBasePrice = existing.type === 'FNB' && nextType === 'FNB'
  const finalBasePrice = keepFnbBasePrice ? existing.base_price : data.base_price

  await db.query("BEGIN")
  try {
    await db.query(`
      UPDATE services
      SET
        name=$1,
        type=$2,
        base_price=$3,
        duration_minutes=$4,
        is_active=$5,
        happy_hour_enabled=$6,
        happy_hour_price=$7
      WHERE id=$8
    `, [
      data.name,
      nextType,
      finalBasePrice,
      data.duration_minutes,
      data.is_active,
      Boolean(data.happy_hour_enabled),
      data.happy_hour_price ?? null,
      id
    ])

    if (nextType === "FNB") {
      const pkgCfg = await resolvePackageGroupConfig(existing.branch_id, data.package_group)
      if (Boolean(data.package_special) && !pkgCfg) {
        throw new Error("Group paket tidak valid atau belum punya konfigurasi paket (qty/harga)")
      }
      const fnbPayload = [
        existing.branch_id,
        id,
        data.name,
        Number(finalBasePrice || 0),
        Boolean(data.package_special),
        pkgCfg?.package_qty ?? null,
        data.package_group || null,
        Boolean(data.package_special),
        pkgCfg?.package_price ?? null,
        pkgCfg?.package_name ?? data.name
      ]
      const updated = await db.query(
        `UPDATE fnb_items
         SET name=$3,
             price=$4,
             is_package=$5,
             package_qty=$6,
             package_group=$7,
             package_special=$8,
             package_price=$9,
             package_name=$10
         WHERE service_id=$2`,
        fnbPayload
      )
      if (!updated.rowCount) {
        await db.query(
          `INSERT INTO fnb_items
           (branch_id, service_id, name, cost_price, price, stock, alert_stock, is_beverage, happy_hour_enabled, happy_hour_price, is_package, package_qty, package_group, item_group, package_special, package_price, package_name)
           VALUES ($1,$2,$3,0,$4,0,0,true,false,NULL,$5,$6,$7,'NORMAL',$8,$9,$10)`,
          fnbPayload
        )
      }
    }

    await db.query("COMMIT")
  } catch (err) {
    await db.query("ROLLBACK")
    throw err
  }
}

exports.toggle = async (id) => {
  await db.query(`
    UPDATE services
    SET is_active = NOT is_active
    WHERE id = $1
  `, [id])
}
//TAMBAHAN
exports.toggleStatus = async (id) => {
  const q = `
    UPDATE services
    SET is_active = NOT is_active
    WHERE id = $1
    RETURNING id, is_active
  `
  const { rows } = await db.query(q, [id])
  return rows[0]
}

exports.cloneFromBranch = async (sourceBranchId, targetBranchId, actor) => {
  await db.query("BEGIN")

  try {
    // Ambil semua service dari source
    //const { rows: services } = await db.query(`
    //  SELECT
    //    type,
    //    name,
    //    base_price,
    //    duration_minutes
     // FROM services
    //  WHERE branch_id = $1
    //    AND deleted_at IS NULL
    //`, [sourceBranchId])
    const { rows: services } = await db.query(
      [
        "SELECT",
        "type,",
        "name,",
        "base_price,",
        "duration_minutes",
        "FROM services",
        "WHERE branch_id = $1",
        "AND deleted_at IS NULL"
      ].join(" "),
      [sourceBranchId]
    )
    if (!services.length) {
      throw new Error("No services to clone from source branch")
    }

    // Insert ke branch target
    for (const s of services) {
    //  await db.query(`
    //    INSERT INTO services (
    //      branch_id,
    //      type,
    //     name,
    //      base_price,
    //      duration_minutes,
    //      is_active
    //    )
    //    VALUES ($1,$2,$3,$4,$5,false)
    //  `, [
    //    targetBranchId,
    //    s.type,
    //    s.name,
    //    s.base_price,
    //    s.duration_minutes
    //  ])
   // }
     await db.query(
        [
          "INSERT INTO services (",
          "branch_id,",
          "type,",
          "name,",
          "base_price,",
          "duration_minutes,",
          "is_active",
          ") VALUES ($1,$2,$3,$4,$5,false)"
        ].join(" "),
        [
          targetBranchId,
          s.type,
          s.name,
          s.base_price,
          s.duration_minutes
        ]
      )
    } 
    await db.query("COMMIT")
    return { success: true, total: services.length }

  } catch (err) {
    await db.query("ROLLBACK")
    throw err
  }
}
