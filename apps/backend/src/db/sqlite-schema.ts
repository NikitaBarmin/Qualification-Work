export const SQLITE_TABLE_NAMES = [
  'users',
  'upload_sessions',
  'datasets',
  'dataset_versions',
  'analyses',
  'analysis_events',
] as const;

export const CREATE_USERS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    business_type TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

export const CREATE_UPLOAD_SESSIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS upload_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    original_file_path TEXT NOT NULL,
    mime_type TEXT,
    file_size INTEGER NOT NULL,
    row_count INTEGER,
    status TEXT NOT NULL CHECK (status IN ('uploaded', 'previewed', 'mapped', 'expired', 'failed')),
    preview_rows_json TEXT,
    inferred_columns_json TEXT,
    auto_mapping_json TEXT,
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`;

export const CREATE_DATASETS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS datasets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    current_version_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`;

export const CREATE_DATASET_VERSIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS dataset_versions (
    id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    upload_session_id TEXT,
    version_number INTEGER NOT NULL,
    original_filename TEXT NOT NULL,
    original_file_path TEXT NOT NULL,
    cleaned_file_path TEXT,
    mapping_config_json TEXT NOT NULL,
    edit_patch_json TEXT,
    schema_json TEXT,
    data_quality_json TEXT,
    row_count INTEGER,
    file_hash TEXT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'processing', 'ready', 'failed')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (upload_session_id) REFERENCES upload_sessions(id) ON DELETE SET NULL,
    UNIQUE (dataset_id, version_number)
  );
`;

export const CREATE_ANALYSES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL,
    dataset_version_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'partial_success', 'failed')),
    data_quality_json TEXT,
    kpi_metrics_json TEXT,
    charts_data_json TEXT,
    diagnostics_json TEXT,
    segments_json TEXT,
    cohorts_json TEXT,
    anomalies_json TEXT,
    tradeoffs_json TEXT,
    swot_results_json TEXT,
    ai_recommendations_json TEXT,
    error_message TEXT,
    started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
    FOREIGN KEY (dataset_version_id) REFERENCES dataset_versions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`;

export const CREATE_ANALYSIS_EVENTS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS analysis_events (
    id TEXT PRIMARY KEY,
    analysis_id TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error')),
    stage TEXT NOT NULL CHECK (
      stage IN ('upload', 'mapping', 'etl', 'duckdb', 'diagnostics', 'ai', 'snapshot')
    ),
    message TEXT NOT NULL,
    payload_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
  );
`;

export const SQLITE_INDEX_STATEMENTS = [
  'CREATE INDEX IF NOT EXISTS idx_upload_sessions_user_id ON upload_sessions(user_id);',
  'CREATE INDEX IF NOT EXISTS idx_upload_sessions_status ON upload_sessions(status);',
  'CREATE INDEX IF NOT EXISTS idx_upload_sessions_expires_at ON upload_sessions(expires_at);',
  'CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);',
  'CREATE INDEX IF NOT EXISTS idx_datasets_user_created_at ON datasets(user_id, created_at);',
  'CREATE INDEX IF NOT EXISTS idx_datasets_current_version_id ON datasets(current_version_id);',
  'CREATE INDEX IF NOT EXISTS idx_dataset_versions_dataset_id ON dataset_versions(dataset_id);',
  'CREATE INDEX IF NOT EXISTS idx_dataset_versions_user_id ON dataset_versions(user_id);',
  'CREATE INDEX IF NOT EXISTS idx_dataset_versions_upload_session_id ON dataset_versions(upload_session_id);',
  'CREATE INDEX IF NOT EXISTS idx_dataset_versions_status ON dataset_versions(status);',
  'CREATE INDEX IF NOT EXISTS idx_dataset_versions_dataset_created_at ON dataset_versions(dataset_id, created_at);',
  'CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);',
  'CREATE INDEX IF NOT EXISTS idx_analyses_dataset_id ON analyses(dataset_id);',
  'CREATE INDEX IF NOT EXISTS idx_analyses_dataset_version_id ON analyses(dataset_version_id);',
  'CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);',
  'CREATE INDEX IF NOT EXISTS idx_analyses_user_created_at ON analyses(user_id, created_at);',
  'CREATE INDEX IF NOT EXISTS idx_analyses_dataset_created_at ON analyses(dataset_id, created_at);',
  'CREATE INDEX IF NOT EXISTS idx_analysis_events_analysis_id ON analysis_events(analysis_id);',
  'CREATE INDEX IF NOT EXISTS idx_analysis_events_analysis_created_at ON analysis_events(analysis_id, created_at);',
  'CREATE INDEX IF NOT EXISTS idx_analysis_events_level ON analysis_events(level);',
  'CREATE INDEX IF NOT EXISTS idx_analysis_events_stage ON analysis_events(stage);',
] as const;
