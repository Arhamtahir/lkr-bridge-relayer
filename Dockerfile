FROM nestjs/cli
# ENV NODE_ENV=production 
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
# RUN npm i -g @nestjs/cli
ENV MONGO_URL=mongodb+srv://muneeb:getndgo_123@cluster0.kglmu.mongodb.net/LKR?retryWrites=true&w=majority \ PRIVATE_KEY1=0xe94758a8c21df8a01f86af459566a9dd20708ef4974d0eefc6d786ea683cb0fa \
    PRIVATE_KEY2=0x609a8a9ef6fa45955886ea323a70ab0ded6b5a656214fea4680605557c1d88b8 \
    ETH_URL=https://rinkeby.infura.io/v3/c89f216154d84b83bb9344a7d0a91108 \
    BSC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/ \
    MAT_URL=https://rpc-mumbai.matic.today \
    TOKEN_ERC=0x87DA04c73109bCa7c7F6E095dDa3A4f6Ec898011 \
    TOKEN_BEP=0xFE153aDb3351b0899253CfF80c291Df4d0894d87 \
    TOKEN_MAT=0xFa8AEaA41393B6baf9A699dAe3d91831dd0A9c11 \
    ERC_BRIDGE=0xc46932635cFe649a24cd3a6BAcb20753Eb61B2Bf \
    BEP_BRIDGE=0xC76a1d42322FD83551D41CaC7D680675E251241c \
    MAT_BRIDGE=0x49865a27913Cd1C18D0368a381583b81D8B3c127
RUN npm install --production --silent
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm","run" ,"start:prod"]
