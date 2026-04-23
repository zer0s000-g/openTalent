import { randomUUID } from 'crypto'
import type { Driver, Transaction } from 'neo4j-driver'
import Papa from 'papaparse'
import type { AppSession } from '@/lib/auth/session'
import { getRuntimeEnv } from '@/lib/env'
import { parseDelimitedList } from '@/lib/normalization'
import { CsvEmployeeRowSchema, type CsvEmployeeRow } from '@/lib/validation'

type ImportMode = 'dry-run' | 'apply'

interface ImportColumnPresence {
  email: boolean
  title: boolean
  department: boolean
  location: boolean
  hired_date: boolean
  manager_id: boolean
  skills: boolean
  certifications: boolean
  education: boolean
  aspiration: boolean
}

interface NormalizedEducation {
  institution: string | null
  degree: string | null
  field: string | null
}

interface NormalizedAspiration {
  type: string
  targetRole: string | null
  targetDepartment: string | null
  timeline: string | null
}

interface NormalizedImportRow {
  rowNumber: number
  data: CsvEmployeeRow
  skills: string[]
  certifications: string[]
  education: NormalizedEducation | null
  aspiration: NormalizedAspiration | null
  warnings: string[]
  action: 'create' | 'update'
}

interface PreparedEmployeeImport {
  totalRows: number
  filename?: string
  columns: ImportColumnPresence
  validRows: NormalizedImportRow[]
  errors: ImportIssue[]
  warnings: ImportIssue[]
  preview: ImportRowPreview[]
}

export interface ImportIssue {
  row: number
  employee_id?: string
  message: string
  severity: 'error' | 'warning'
}

export interface ImportRowPreview {
  row: number
  employee_id?: string
  name?: string
  status: 'create' | 'update' | 'invalid'
  warnings: string[]
}

export interface ImportResult {
  mode: ImportMode
  filename?: string
  totalRows: number
  validRows: number
  invalidRows: number
  rowsToCreate: number
  rowsToUpdate: number
  successful: number
  failed: number
  warnings: ImportIssue[]
  errors: ImportIssue[]
  preview: ImportRowPreview[]
  applied: boolean
  importedAt?: string
  batchId?: string
}

export interface RecentImportBatch {
  id: string
  source: string
  filename?: string
  importedAt: string
  actorEmail?: string
  actorName?: string
  totalRows: number
  validRows: number
  invalidRows: number
  rowsToCreate: number
  rowsToUpdate: number
  warningCount: number
  employeeCount: number
  issues: ImportIssue[]
}

export interface ImportEmployeesOptions {
  mode?: ImportMode
  actor?: AppSession | null
  filename?: string
}

function buildColumnPresence(fields: string[]): ImportColumnPresence {
  const set = new Set(fields)
  return {
    email: set.has('email'),
    title: set.has('title'),
    department: set.has('department'),
    location: set.has('location'),
    hired_date: set.has('hired_date'),
    manager_id: set.has('manager_id'),
    skills: set.has('skills'),
    certifications: set.has('certifications'),
    education:
      set.has('education_institution') || set.has('education_degree') || set.has('education_field'),
    aspiration:
      set.has('aspiration_type') ||
      set.has('aspiration_target_role') ||
      set.has('aspiration_target_department') ||
      set.has('aspiration_timeline'),
  }
}

function toDistinctHeaders(fields: string[] | undefined): string[] {
  return Array.from(
    new Set(
      (fields ?? [])
        .map((field) => field.trim())
        .filter(Boolean),
    ),
  )
}

async function fetchExistingEmployeeIds(driver: Driver, employeeIds: string[]) {
  if (employeeIds.length === 0) {
    return new Set<string>()
  }

  const env = getRuntimeEnv()
  const session = driver.session({ database: env.NEO4J_DATABASE })
  try {
    const result = await session.run(
      `
        UNWIND $employeeIds AS employeeId
        OPTIONAL MATCH (e:Employee { employee_id: employeeId })
        WITH employeeId, e
        WHERE e IS NOT NULL
        RETURN employeeId
      `,
      { employeeIds },
    )

    return new Set(result.records.map((record) => String(record.get('employeeId'))))
  } finally {
    await session.close()
  }
}

function createImportIssue(
  severity: 'error' | 'warning',
  row: number,
  employeeId: string | undefined,
  message: string,
): ImportIssue {
  return {
    row,
    employee_id: employeeId,
    message,
    severity,
  }
}

export async function prepareEmployeeImport(
  driver: Driver,
  csv: string,
  options: Pick<ImportEmployeesOptions, 'filename'> = {},
): Promise<PreparedEmployeeImport> {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  })

  const fields = toDistinctHeaders(parsed.meta.fields)
  const columns = buildColumnPresence(fields)
  const totalRows = parsed.data.length
  const seenEmployeeIds = new Map<string, number>()
  const csvEmployeeIds = new Set<string>()

  for (let index = 0; index < parsed.data.length; index += 1) {
    const rawEmployeeId = parsed.data[index]?.employee_id?.trim()
    if (!rawEmployeeId) continue
    csvEmployeeIds.add(rawEmployeeId)
    seenEmployeeIds.set(rawEmployeeId, (seenEmployeeIds.get(rawEmployeeId) || 0) + 1)
  }

  const managerIds = Array.from(
    new Set(
      parsed.data
        .map((row) => row.manager_id?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  )
  const existingEmployeeIds = await fetchExistingEmployeeIds(
    driver,
    Array.from(new Set([...csvEmployeeIds, ...managerIds])),
  )
  const resolvableManagers = new Set<string>([...existingEmployeeIds, ...csvEmployeeIds])

  const errors: ImportIssue[] = []
  const warnings: ImportIssue[] = []
  const validRows: NormalizedImportRow[] = []
  const preview: ImportRowPreview[] = []

  for (let index = 0; index < parsed.data.length; index += 1) {
    const rawRow = parsed.data[index]
    const rowNumber = index + 2
    const validated = CsvEmployeeRowSchema.safeParse(rawRow)

    if (!validated.success) {
      const employeeId = rawRow.employee_id?.trim() || undefined
      errors.push(
        createImportIssue(
          'error',
          rowNumber,
          employeeId,
          validated.error.issues.map((issue) => issue.message).join('; '),
        ),
      )
      preview.push({
        row: rowNumber,
        employee_id: employeeId,
        name: rawRow.name?.trim() || undefined,
        status: 'invalid',
        warnings: [],
      })
      continue
    }

    const row = validated.data
    const rowWarnings: string[] = []
    const rowErrors: string[] = []

    if ((seenEmployeeIds.get(row.employee_id) || 0) > 1) {
      rowErrors.push('employee_id appears multiple times in this CSV')
    }

    if (columns.manager_id) {
      if (row.manager_id === row.employee_id) {
        rowErrors.push('manager_id cannot reference the same employee')
      } else if (row.manager_id && !resolvableManagers.has(row.manager_id)) {
        rowErrors.push('manager_id does not match an employee in the directory or this import file')
      }
    }

    const skills = columns.skills ? parseDelimitedList(row.skills) : []
    const certifications = columns.certifications ? parseDelimitedList(row.certifications) : []
    const education = columns.education
      ? {
          institution: row.education_institution ?? null,
          degree: row.education_degree ?? null,
          field: row.education_field ?? null,
        }
      : null
    const aspiration = columns.aspiration && row.aspiration_type
      ? {
          type: row.aspiration_type,
          targetRole: row.aspiration_target_role ?? null,
          targetDepartment: row.aspiration_target_department ?? null,
          timeline: row.aspiration_timeline ?? null,
        }
      : null

    if (columns.skills && row.skills && skills.length === 0) {
      rowWarnings.push('skills column was provided but no valid skills were parsed')
    }

    if (columns.certifications && row.certifications && certifications.length === 0) {
      rowWarnings.push('certifications column was provided but no valid certifications were parsed')
    }

    const action = existingEmployeeIds.has(row.employee_id) ? 'update' : 'create'

    if (rowErrors.length > 0) {
      for (const message of rowErrors) {
        errors.push(createImportIssue('error', rowNumber, row.employee_id, message))
      }
      preview.push({
        row: rowNumber,
        employee_id: row.employee_id,
        name: row.name,
        status: 'invalid',
        warnings: rowWarnings,
      })
      for (const message of rowWarnings) {
        warnings.push(createImportIssue('warning', rowNumber, row.employee_id, message))
      }
      continue
    }

    validRows.push({
      rowNumber,
      data: row,
      skills,
      certifications,
      education,
      aspiration,
      warnings: rowWarnings,
      action,
    })

    preview.push({
      row: rowNumber,
      employee_id: row.employee_id,
      name: row.name,
      status: action,
      warnings: rowWarnings,
    })

    for (const message of rowWarnings) {
      warnings.push(createImportIssue('warning', rowNumber, row.employee_id, message))
    }
  }

  return {
    totalRows,
    filename: options.filename,
    columns,
    validRows,
    errors,
    warnings,
    preview,
  }
}

async function ensureIndexes(tx: Transaction) {
  await tx.run('CREATE INDEX employee_id_idx IF NOT EXISTS FOR (e:Employee) ON (e.employee_id)')
  await tx.run('CREATE INDEX employee_name_idx IF NOT EXISTS FOR (e:Employee) ON (e.name)')
  await tx.run('CREATE INDEX employee_department_idx IF NOT EXISTS FOR (e:Employee) ON (e.department)')
  await tx.run('CREATE INDEX skill_name_idx IF NOT EXISTS FOR (s:Skill) ON (s.name)')
  await tx.run('CREATE INDEX role_title_idx IF NOT EXISTS FOR (r:Role) ON (r.title)')
  await tx.run('CREATE INDEX department_name_idx IF NOT EXISTS FOR (d:Department) ON (d.name)')
  await tx.run('CREATE INDEX import_batch_id_idx IF NOT EXISTS FOR (b:ImportBatch) ON (b.id)')
}

async function ensureImportIndexes(driver: Driver) {
  const env = getRuntimeEnv()
  const session = driver.session({ database: env.NEO4J_DATABASE })
  const tx = await session.beginTransaction()

  try {
    await ensureIndexes(tx)
    await tx.commit()
  } catch (error) {
    await tx.rollback()
    throw error
  } finally {
    await session.close()
  }
}

async function createImportBatch(tx: Transaction, params: {
  batchId: string
  filename: string | null
  importedAt: string
  actorEmail: string | null
  actorName: string | null
  totalRows: number
  validRows: number
  invalidRows: number
  rowsToCreate: number
  rowsToUpdate: number
  warningCount: number
}) {
  await tx.run(
    `
      CREATE (batch:ImportBatch {
        id: $batchId,
        source: 'csv',
        filename: $filename,
        importedAt: datetime($importedAt),
        actorEmail: $actorEmail,
        actorName: $actorName,
        totalRows: $totalRows,
        validRows: $validRows,
        invalidRows: $invalidRows,
        rowsToCreate: $rowsToCreate,
        rowsToUpdate: $rowsToUpdate,
        warningCount: $warningCount
      })
    `,
    params,
  )
}

async function createImportBatchIssues(tx: Transaction, params: {
  batchId: string
  warnings: ImportIssue[]
  errors: ImportIssue[]
}) {
  const issues = [...params.errors, ...params.warnings]
  if (issues.length === 0) return

  await tx.run(
    `
      MATCH (batch:ImportBatch { id: $batchId })
      UNWIND $issues AS issue
      CREATE (batch)-[:HAS_ISSUE]->(:ImportBatchIssue {
        row: issue.row,
        employee_id: issue.employee_id,
        message: issue.message,
        severity: issue.severity
      })
    `,
    {
      batchId: params.batchId,
      issues,
    },
  )
}

async function upsertEmployeeCore(
  tx: Transaction,
  row: NormalizedImportRow,
  columns: ImportColumnPresence,
  batchId: string,
  importedAt: string,
  filename: string | undefined,
) {
  await tx.run(
    `
      MERGE (e:Employee { employee_id: $employee_id })
      ON CREATE SET e.createdAt = datetime($importedAt)
      SET e.name = $name,
          e.lastImportedAt = datetime($importedAt),
          e.lastImportBatchId = $batchId,
          e.lastImportSource = $filename
      FOREACH (_ IN CASE WHEN $hasEmail THEN [1] ELSE [] END |
        SET e.email = $email
      )
      FOREACH (_ IN CASE WHEN $hasTitle THEN [1] ELSE [] END |
        SET e.title = $title
      )
      FOREACH (_ IN CASE WHEN $hasDepartment THEN [1] ELSE [] END |
        SET e.department = $department
      )
      FOREACH (_ IN CASE WHEN $hasLocation THEN [1] ELSE [] END |
        SET e.location = $location
      )
      FOREACH (_ IN CASE WHEN $hasHiredDate THEN [1] ELSE [] END |
        SET e.hired_date = CASE WHEN $hired_date IS NULL THEN null ELSE date($hired_date) END
      )
    `,
    {
      employee_id: row.data.employee_id,
      name: row.data.name,
      email: row.data.email ?? null,
      title: row.data.title ?? null,
      department: row.data.department ?? null,
      location: row.data.location ?? null,
      hired_date: row.data.hired_date ?? null,
      hasEmail: columns.email,
      hasTitle: columns.title,
      hasDepartment: columns.department,
      hasLocation: columns.location,
      hasHiredDate: columns.hired_date,
      batchId,
      importedAt,
      filename: filename ?? null,
    },
  )
}

async function reconcileDepartment(tx: Transaction, row: NormalizedImportRow, columns: ImportColumnPresence) {
  if (!columns.department) return

  await tx.run(
    `
      MATCH (e:Employee { employee_id: $employee_id })
      OPTIONAL MATCH (e)-[old:BELONGS_TO_DEPARTMENT]->(:Department)
      DELETE old
      WITH e
      FOREACH (_ IN CASE WHEN $department IS NULL THEN [] ELSE [1] END |
        MERGE (d:Department { name: $department })
        MERGE (e)-[:BELONGS_TO_DEPARTMENT]->(d)
      )
    `,
    {
      employee_id: row.data.employee_id,
      department: row.data.department ?? null,
    },
  )
}

async function reconcileRole(tx: Transaction, row: NormalizedImportRow, columns: ImportColumnPresence) {
  if (!columns.title) return

  await tx.run(
    `
      MATCH (e:Employee { employee_id: $employee_id })
      OPTIONAL MATCH (e)-[old:HAS_ROLE]->(:Role)
      DELETE old
      WITH e
      FOREACH (_ IN CASE WHEN $title IS NULL THEN [] ELSE [1] END |
        MERGE (r:Role { title: $title })
        MERGE (e)-[:HAS_ROLE]->(r)
      )
    `,
    {
      employee_id: row.data.employee_id,
      title: row.data.title ?? null,
    },
  )
}

async function reconcileManager(tx: Transaction, row: NormalizedImportRow, columns: ImportColumnPresence) {
  if (!columns.manager_id) return

  await tx.run(
    `
      MATCH (e:Employee { employee_id: $employee_id })
      OPTIONAL MATCH (e)-[old:REPORTS_TO]->(:Employee)
      DELETE old
      WITH e
      OPTIONAL MATCH (m:Employee { employee_id: $manager_id })
      FOREACH (_ IN CASE WHEN m IS NULL THEN [] ELSE [1] END |
        MERGE (e)-[:REPORTS_TO]->(m)
      )
    `,
    {
      employee_id: row.data.employee_id,
      manager_id: row.data.manager_id ?? null,
    },
  )
}

async function reconcileSkills(tx: Transaction, row: NormalizedImportRow, columns: ImportColumnPresence) {
  if (!columns.skills) return

  await tx.run(
    `
      MATCH (e:Employee { employee_id: $employee_id })
      OPTIONAL MATCH (e)-[old:HAS_SKILL]->(oldSkill:Skill)
      WHERE NOT oldSkill.name IN $skillNames
      DELETE old
      WITH e
      UNWIND $skillNames AS skillName
      MERGE (s:Skill { name: skillName })
      MERGE (e)-[:HAS_SKILL]->(s)
    `,
    {
      employee_id: row.data.employee_id,
      skillNames: row.skills,
    },
  )
}

async function reconcileCertifications(tx: Transaction, row: NormalizedImportRow, columns: ImportColumnPresence) {
  if (!columns.certifications) return

  await tx.run(
    `
      MATCH (e:Employee { employee_id: $employee_id })
      OPTIONAL MATCH (e)-[old:HOLDS_CERTIFICATION]->(oldCertification:Certification)
      WHERE NOT oldCertification.name IN $certificationNames
      DELETE old
      WITH e
      UNWIND $certificationNames AS certificationName
      MERGE (c:Certification { name: certificationName })
      MERGE (e)-[:HOLDS_CERTIFICATION]->(c)
    `,
    {
      employee_id: row.data.employee_id,
      certificationNames: row.certifications,
    },
  )
}

async function reconcileEducation(tx: Transaction, row: NormalizedImportRow, columns: ImportColumnPresence) {
  if (!columns.education) return

  await tx.run(
    `
      MATCH (e:Employee { employee_id: $employee_id })
      OPTIONAL MATCH (e)-[old:HAS_EDUCATION]->(:Education)
      DELETE old
      WITH e
      FOREACH (_ IN CASE WHEN $institution IS NULL THEN [] ELSE [1] END |
        MERGE (ed:Education {
          institution: $institution,
          degree: coalesce($degree, ''),
          field: coalesce($field, '')
        })
        MERGE (e)-[:HAS_EDUCATION]->(ed)
      )
    `,
    {
      employee_id: row.data.employee_id,
      institution: row.education?.institution ?? null,
      degree: row.education?.degree ?? null,
      field: row.education?.field ?? null,
    },
  )
}

async function reconcileAspirations(tx: Transaction, row: NormalizedImportRow, columns: ImportColumnPresence) {
  if (!columns.aspiration) return

  await tx.run(
    `
      MATCH (e:Employee { employee_id: $employee_id })
      OPTIONAL MATCH (e)-[:ASPIRES_TO]->(oldAspiration:Aspiration)
      WITH e, collect(oldAspiration) AS oldAspirations
      FOREACH (aspiration IN oldAspirations |
        DETACH DELETE aspiration
      )
      WITH e
      FOREACH (_ IN CASE WHEN $type IS NULL THEN [] ELSE [1] END |
        CREATE (a:Aspiration {
          type: $type,
          targetRole: $targetRole,
          targetDepartment: $targetDepartment,
          timeline: $timeline
        })
        CREATE (e)-[:ASPIRES_TO]->(a)
      )
    `,
    {
      employee_id: row.data.employee_id,
      type: row.aspiration?.type ?? null,
      targetRole: row.aspiration?.targetRole ?? null,
      targetDepartment: row.aspiration?.targetDepartment ?? null,
      timeline: row.aspiration?.timeline ?? null,
    },
  )
}

async function attachEmployeeToBatch(tx: Transaction, employeeId: string, batchId: string) {
  await tx.run(
    `
      MATCH (batch:ImportBatch { id: $batchId })
      MATCH (e:Employee { employee_id: $employee_id })
      MERGE (batch)-[:IMPORTED_EMPLOYEE]->(e)
    `,
    {
      batchId,
      employee_id: employeeId,
    },
  )
}

async function applyPreparedImport(
  driver: Driver,
  prepared: PreparedEmployeeImport,
  options: ImportEmployeesOptions,
) {
  await ensureImportIndexes(driver)

  const env = getRuntimeEnv()
  const session = driver.session({ database: env.NEO4J_DATABASE })
  const tx = await session.beginTransaction()
  const importedAt = new Date().toISOString()
  const batchId = randomUUID()

  try {
    await createImportBatch(tx, {
      batchId,
      filename: options.filename ?? null,
      importedAt,
      actorEmail: options.actor?.email ?? null,
      actorName: options.actor?.name ?? null,
      totalRows: prepared.totalRows,
      validRows: prepared.validRows.length,
      invalidRows: prepared.errors.length > 0 ? prepared.preview.filter((row) => row.status === 'invalid').length : 0,
      rowsToCreate: prepared.validRows.filter((row) => row.action === 'create').length,
      rowsToUpdate: prepared.validRows.filter((row) => row.action === 'update').length,
      warningCount: prepared.warnings.length,
    })
    await createImportBatchIssues(tx, {
      batchId,
      warnings: prepared.warnings,
      errors: prepared.errors,
    })

    for (const row of prepared.validRows) {
      await upsertEmployeeCore(tx, row, prepared.columns, batchId, importedAt, options.filename)
      await attachEmployeeToBatch(tx, row.data.employee_id, batchId)
    }

    for (const row of prepared.validRows) {
      await reconcileDepartment(tx, row, prepared.columns)
      await reconcileRole(tx, row, prepared.columns)
      await reconcileManager(tx, row, prepared.columns)
      await reconcileSkills(tx, row, prepared.columns)
      await reconcileCertifications(tx, row, prepared.columns)
      await reconcileEducation(tx, row, prepared.columns)
      await reconcileAspirations(tx, row, prepared.columns)
    }

    await tx.commit()

    return {
      batchId,
      importedAt,
    }
  } catch (error) {
    await tx.rollback()
    throw error
  } finally {
    await session.close()
  }
}

export async function importEmployeesFromCsv(
  driver: Driver,
  csv: string,
  options: ImportEmployeesOptions = {},
): Promise<ImportResult> {
  const mode = options.mode ?? 'apply'
  const prepared = await prepareEmployeeImport(driver, csv, {
    filename: options.filename,
  })

  if (mode === 'apply' && prepared.errors.length > 0) {
    return {
      mode,
      filename: options.filename,
      totalRows: prepared.totalRows,
      validRows: prepared.validRows.length,
      invalidRows: prepared.preview.filter((row) => row.status === 'invalid').length,
      rowsToCreate: prepared.validRows.filter((row) => row.action === 'create').length,
      rowsToUpdate: prepared.validRows.filter((row) => row.action === 'update').length,
      successful: 0,
      failed: prepared.preview.filter((row) => row.status === 'invalid').length,
      warnings: prepared.warnings,
      errors: prepared.errors,
      preview: prepared.preview,
      applied: false,
    }
  }

  const appliedMetadata =
    mode === 'apply'
      ? await applyPreparedImport(driver, prepared, options)
      : null

  const invalidRows = prepared.preview.filter((row) => row.status === 'invalid').length
  const rowsToCreate = prepared.validRows.filter((row) => row.action === 'create').length
  const rowsToUpdate = prepared.validRows.filter((row) => row.action === 'update').length

  return {
    mode,
    filename: options.filename,
    totalRows: prepared.totalRows,
    validRows: prepared.validRows.length,
    invalidRows,
    rowsToCreate,
    rowsToUpdate,
    successful: mode === 'apply' ? prepared.validRows.length : 0,
    failed: mode === 'apply' ? invalidRows : 0,
    warnings: prepared.warnings,
    errors: prepared.errors,
    preview: prepared.preview,
    applied: Boolean(appliedMetadata),
    importedAt: appliedMetadata?.importedAt,
    batchId: appliedMetadata?.batchId,
  }
}

export async function listRecentImportBatches(driver: Driver, limit = 8): Promise<RecentImportBatch[]> {
  const env = getRuntimeEnv()
  const session = driver.session({ database: env.NEO4J_DATABASE })

  try {
    const result = await session.run(
      `
        MATCH (batch:ImportBatch)
        OPTIONAL MATCH (batch)-[:IMPORTED_EMPLOYEE]->(employee:Employee)
        OPTIONAL MATCH (batch)-[:HAS_ISSUE]->(issue:ImportBatchIssue)
        WITH batch,
             count(DISTINCT employee) AS employeeCount,
             collect(DISTINCT issue) AS issueNodes
        RETURN batch, employeeCount, issueNodes
        ORDER BY batch.importedAt DESC
        LIMIT toInteger($limit)
      `,
      { limit },
    )

    return result.records.map((record) => {
      const batch = record.get('batch')
      const issueNodes = (record.get('issueNodes') || []).filter(Boolean)
      return {
        id: batch.properties.id,
        source: batch.properties.source,
        filename: batch.properties.filename ?? undefined,
        importedAt: batch.properties.importedAt?.toString?.() ?? '',
        actorEmail: batch.properties.actorEmail ?? undefined,
        actorName: batch.properties.actorName ?? undefined,
        totalRows: Number(batch.properties.totalRows ?? 0),
        validRows: Number(batch.properties.validRows ?? 0),
        invalidRows: Number(batch.properties.invalidRows ?? 0),
        rowsToCreate: Number(batch.properties.rowsToCreate ?? 0),
        rowsToUpdate: Number(batch.properties.rowsToUpdate ?? 0),
        warningCount: Number(batch.properties.warningCount ?? 0),
        employeeCount: neo4jNumberToNumber(record.get('employeeCount')),
        issues: issueNodes
          .map((issueNode: any) => ({
            row: neo4jNumberToNumber(issueNode.properties.row),
            employee_id: issueNode.properties.employee_id ?? undefined,
            message: issueNode.properties.message,
            severity: issueNode.properties.severity,
          }))
          .sort((left: ImportIssue, right: ImportIssue) => left.row - right.row),
      } satisfies RecentImportBatch
    })
  } finally {
    await session.close()
  }
}

function neo4jNumberToNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object') {
    const candidate = value as { toNumber?: () => number; low?: number }
    if (typeof candidate.toNumber === 'function') return candidate.toNumber()
    if (typeof candidate.low === 'number') return candidate.low
  }
  return 0
}
