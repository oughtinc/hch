# HCH

This is an implementation of Paul Christiano's [HCH](https://ai-alignment.com/strong-hch-bedb0dc08d4e) in Javascript (NodeJS). It is directly based on the [Python implementation of ALBA](https://github.com/paulfchristiano/alba/).

## How to use

Install:

    git clone https://github.com/oughtinc/hch.git
    cd hch
    npm install    # or: yarn
    npm run build  # or: yarn run build

Then:

    node build/index.js

See the [ALBA README](https://github.com/paulfchristiano/alba/blob/master/README.md#using-hch) for instructions on how to interact with HCH.

## Development

Open bash environment with node:

    docker run -it -v $(pwd):/data -w /data node bash

Build and run index.js:

    docker run -it -v $(pwd):/data -w /data node bash -c "yarn build && node build/index.js"

Build index.js and run in debugger:

    docker run -it --expose 9229 -p 127.0.0.1:9229:9229 -v $(pwd):/data -w /data node bash -c "yarn build && node --inspect=0.0.0.0:9229 --debug-brk build/index.js"

Run Flow type checker:

    docker run -it -v $(pwd):/data -w /data node watch --color "node_modules/.bin/flow --color always"
    
Run ESLint:

    docker run -it -v $(pwd):/data -w /data node bash -c 'watch --color "node_modules/.bin/esw . --color --ext .jsx --ext .js"'
