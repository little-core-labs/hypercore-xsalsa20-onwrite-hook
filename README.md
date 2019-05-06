hypercore-xsalsa20-onwrite-hook
===============================

A write hook to decrypt data using a XSalsa20 cipher into a hypercore
storage when replicating from peers.


## Installation

```sh
$ npm install hypercore-xsalsa20-onwrite-hook
```

## Usage

```js
const hook = require('hypercore-xsalsa20-onwrite-hook')
const feed = hypercore(storage, key, {
  onwrite: hook({
    nonce: storageNonce,
    key: sharedStorageKey
  })
})
```

## Example

```js
const { keyPair } = require('hypercore-crypto')
const replicate = require('hypercore-replicate')
const hypercore = require('hypercore')
const xsalsa20 = require('xsalsa20-encoding')
const crypto = require('crypto')
const hook = require('hypercore-xsalsa20-onwrite-hook')
const ram = require('random-access-memory')

const kp = keyPair()
const key = crypto.randomBytes(32)
const codec = xsalsa20(kp.publicKey, key)
const onwrite = hook({ key })
const feed = hypercore(ram, {
  key: kp.publicKey,
  secretKey: kp.secretKey,
  valueEncoding: codec,
})

feed.ready(() => {
  const copy = hypercore(ram, feed.key, { onwrite })

  feed.append('hello')
  replicate(feed, copy, { live: true })
  copy.update(() => {
    copy.head((err, buf) => {
      console.log('%', buf) // 'hello'
    })
  })
})
```

## API

### `hook = require('hypercore-xsalsa20-onwrite-hook')(opts)`

where `opts` can be:

```js
{
  nonce: [Buffer], // An optional 24 byte nonce. If not given, the hypercore's public key is used
  key: Buffer, // A required shared 32 byte shared secret key
}
```

## License

MIT
