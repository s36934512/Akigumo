# FROM mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm
FROM mcr.microsoft.com/devcontainers/javascript-node

# [Optional] Uncomment this section to install additional OS packages.
# RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
#     && apt-get -y install --no-install-recommends <your-package-list-here>
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install wget \
    && wget http://ftp.de.debian.org/debian/pool/non-free/u/unrar-nonfree/unrar_6.2.6-1+deb12u1_amd64.deb \
    && apt-get -y install ./unrar_6.2.6-1+deb12u1_amd64.deb \
    && rm unrar_6.2.6-1+deb12u1_amd64.deb \
    && git config --global user.name "s36934512" \
    && git config --global user.email "s36934512@gmail.com"
    # && wget http://ftp.de.debian.org/debian/pool/main/w/wal2json/postgresql-18-wal2json_2.6-3_amd64.deb \
    # && apt-get -y install ./postgresql-18-wal2json_2.6-3_amd64.deb 
    # && rm postgresql-18-wal2json_2.6-3_amd64.deb

# [Optional] Uncomment if you want to install an additional version of node using nvm
# ARG EXTRA_NODE_VERSION=10
# RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install ${EXTRA_NODE_VERSION}"

# [Optional] Uncomment if you want to install more global node modules
# RUN su node -c "npm install -g <your-package-list-here>"
RUN su node -c "npm install -g @angular/cli"