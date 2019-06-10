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

const key = crypto.randomBytes(32)
const nonce = crypto.randomBytes(32)
const onwrite = hook({ nonce, key })
const { publicKey, secretKey } = keyPair()
const valueEncoding = xsalsa20(nonce, key)

const feed = hypercore(ram, publicKey, { secretKey, valueEncoding })

feed.ready(() => {
  const copy = hypercore(ram, publicKey, { onwrite })
  const other = hypercore(ram, publicKey, { valueEncoding })

  feed.append('hello')

  replicate(feed, copy.replicate({ live: true }), other.replicate({ live: true }), {
    userData: Buffer.from([0xfa, 0xce]),
    live: true
  })

  copy.update(() => {
    copy.head((err, buf) => {
      console.log('%s', buf) // 'hello'
    })
  })

  other.update(() => {
    other.head((err, buf) => {
      console.log('%s', buf) // 'hello'
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
