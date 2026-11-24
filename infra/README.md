# Local stack

Runs PostgreSQL 16, RabbitMQ and all 9itchi services with Docker Compose.

1. Clone the 12 repositories side by side (`9itchi-account-api`, ..., `9itchi-client`).
2. `cd 9itchi-client/infra && cp .env.example .env`, then fill at least `ITCHI_SECRET_KEY`, `ITCHI_ENCRYPTION_KEY` and `INTERNAL_API_KEY` (`openssl rand -hex 32`).
3. `docker compose up --build`.

Services listen on 8081 to 8091, the client on http://localhost:3000, RabbitMQ's console on http://localhost:15672 (guest/guest). Each service runs its own migrations at startup. Optional integrations (Google, LinkedIn, Mailgun, Ably, Flouci) stay off while their keys are empty.

`NEXT_PUBLIC_*` values are read when the client image is built: change them, then rebuild the client.
