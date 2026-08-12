use anyhow::{Context, Result};
use axum::{
    extract::State,
    http::{header::CONTENT_TYPE, HeaderValue, Method, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, FromRow, PgPool};
use std::{env, net::SocketAddr};
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[derive(Clone)]
struct AppState {
    pool: PgPool,
}

#[derive(Debug, Clone)]
struct Settings {
    database_url: String,
    frontend_origin: String,
    host: String,
    port: u16,
}

#[derive(Debug, Deserialize)]
struct CreateRequest {
    name: String,
    subject: String,
    description: String,
    deadline: Option<NaiveDate>,
}

#[derive(Debug)]
struct ValidatedRequest {
    name: String,
    subject: String,
    description: String,
    deadline: Option<NaiveDate>,
}

#[derive(Debug, Serialize, FromRow)]
struct CreatedRequest {
    id: i64,
    created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
struct CreateRequestResponse {
    id: i64,
    created_at: DateTime<Utc>,
    message: &'static str,
}

#[derive(Debug, Serialize)]
struct HealthResponse {
    status: &'static str,
}

#[derive(Debug, Serialize)]
struct ErrorResponse {
    error: String,
    details: Vec<String>,
}

enum ApiError {
    Validation(Vec<String>),
    Database(sqlx::Error),
}

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .with(tracing_subscriber::fmt::layer())
        .init();

    let settings = Settings::from_env()?;
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&settings.database_url)
        .await
        .context("could not connect to PostgreSQL")?;

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .context("could not run database migrations")?;

    let app = build_router(pool, &settings)?;
    let addr: SocketAddr = format!("{}:{}", settings.host, settings.port)
        .parse()
        .context("HOST and PORT must form a valid socket address")?;

    tracing::info!("API listening on http://{addr}");
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

fn build_router(pool: PgPool, settings: &Settings) -> Result<Router> {
    let allowed_origin: HeaderValue = settings
        .frontend_origin
        .parse()
        .context("FRONTEND_ORIGIN must be a valid origin, for example http://localhost:8080")?;

    let cors = CorsLayer::new()
        .allow_origin(allowed_origin)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([CONTENT_TYPE]);

    Ok(Router::new()
        .route("/api/health", get(health))
        .route("/api/requests", post(create_request))
        .with_state(AppState { pool })
        .layer(cors)
        .layer(TraceLayer::new_for_http()))
}

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse { status: "ok" })
}

async fn create_request(
    State(state): State<AppState>,
    Json(input): Json<CreateRequest>,
) -> Result<(StatusCode, Json<CreateRequestResponse>), ApiError> {
    let request = validate_request(input).map_err(ApiError::Validation)?;

    let created = sqlx::query_as::<_, CreatedRequest>(
        r#"
        INSERT INTO task_requests (name, subject, description, deadline)
        VALUES ($1, $2, $3, $4)
        RETURNING id, created_at
        "#,
    )
    .bind(request.name)
    .bind(request.subject)
    .bind(request.description)
    .bind(request.deadline)
    .fetch_one(&state.pool)
    .await
    .map_err(ApiError::Database)?;

    Ok((
        StatusCode::CREATED,
        Json(CreateRequestResponse {
            id: created.id,
            created_at: created.created_at,
            message: "request_registered",
        }),
    ))
}

fn validate_request(input: CreateRequest) -> Result<ValidatedRequest, Vec<String>> {
    let name = input.name.trim().to_owned();
    let subject = input.subject.trim().to_owned();
    let description = input.description.trim().to_owned();
    let mut errors = Vec::new();

    if !(3..=100).contains(&name.chars().count()) {
        errors.push("El nombre debe tener entre 3 y 100 caracteres.".to_owned());
    }

    if !(2..=100).contains(&subject.chars().count()) {
        errors.push("La materia debe tener entre 2 y 100 caracteres.".to_owned());
    }

    if !(10..=2000).contains(&description.chars().count()) {
        errors.push("La descripcion debe tener entre 10 y 2000 caracteres.".to_owned());
    }

    if let Some(deadline) = input.deadline {
        if deadline < Utc::now().date_naive() {
            errors.push("La fecha de entrega no puede estar en el pasado.".to_owned());
        }
    }

    if errors.is_empty() {
        Ok(ValidatedRequest {
            name,
            subject,
            description,
            deadline: input.deadline,
        })
    } else {
        Err(errors)
    }
}

impl Settings {
    fn from_env() -> Result<Self> {
        Ok(Self {
            database_url: env::var("DATABASE_URL").context("DATABASE_URL is required")?,
            frontend_origin: env::var("FRONTEND_ORIGIN")
                .unwrap_or_else(|_| "http://localhost:8080".to_owned()),
            host: env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_owned()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "3001".to_owned())
                .parse()
                .context("PORT must be a number")?,
        })
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        match self {
            ApiError::Validation(details) => (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "validation_error".to_owned(),
                    details,
                }),
            )
                .into_response(),
            ApiError::Database(error) => {
                tracing::error!(%error, "database error while creating request");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse {
                        error: "database_error".to_owned(),
                        details: vec!["No pudimos registrar la solicitud.".to_owned()],
                    }),
                )
                    .into_response()
            }
        }
    }
}
