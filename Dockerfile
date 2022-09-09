FROM gplane/pnpm:alpine

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM gplane/pnpm:alpine

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
RUN pnpm i --frozen-lockfile --prod

COPY --from=0 dist .
COPY LICENSE .

CMD ["node", "index"]