FROM node:24-alpine

ARG DOMOVIEW_REPOSITORY=https://github.com/tomjschr/DomoView.git
ARG DOMOVIEW_REF=main

RUN apk add --no-cache bash git jq \
    && git clone --depth 1 --branch "${DOMOVIEW_REF}" "${DOMOVIEW_REPOSITORY}" /app \
    && cd /app \
    && npm ci \
    && npm run build \
    && npm cache clean --force

COPY run.sh /run.sh
RUN chmod +x /run.sh

EXPOSE 8099
CMD ["/run.sh"]
