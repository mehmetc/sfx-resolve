FROM node:current-alpine 
MAINTAINER mehmet.celik@kuleuven.be

RUN apk add --update \
    python \
    python-dev \
    py-pip \
    build-base \
    && pip install virtualenv \
    && rm -rf /var/cache/apk/*

#Install Yarn
RUN mkdir -p /opt
ADD https://yarnpkg.com/latest.tar.gz /opt
RUN mv /opt/yarn* /opt/yarn
ENV PATH "$PATH:/opt/yarn/bin"


RUN mkdir /app
RUN chown -R node:node /app
USER node

EXPOSE 3000

COPY . /app
WORKDIR /app

RUN yarn

CMD ["node", "server.js"]

