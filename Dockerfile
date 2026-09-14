# OpenRecruitOS Community Edition — Docker image
# Build args:
#   DATABASE_PROVIDER=sqlite (default) | postgresql
# Run args (env):
#   DATABASE_URL, JWT_SECRET, UPLOAD_DIR, SEED_DEMO_DATA

FROM oven/bun:1.2 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1.2 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Pick the Prisma datasource provider at build time (sqlite | postgresql)
ARG DATABASE_PROVIDER=sqlite
RUN if [ "$DATABASE_PROVIDER" = "postgresql" ]; then \
      cp prisma/schema.postgres.prisma prisma/schema.prisma; \
    fi
RUN bunx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

FROM oven/bun:1.2 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Next.js standalone server (already includes .next/static and public)
COPY --from=builder /app/.next/standalone ./
# Prisma CLI/client + schema for `db push` at startup, seed script, migrations helper
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package.json ./package.json
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

RUN mkdir -p /app/db /app/uploads
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
