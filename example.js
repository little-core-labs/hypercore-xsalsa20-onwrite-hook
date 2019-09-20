const { keyPair } = require('hypercore-crypto')
const replicate = require('hypercore-replicate')
const hypercore = require('hypercore')
const xsalsa20 = require('xsalsa20-encoding')
const crypto = require('crypto')
const hook = require('./')
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

  replicate(feed, replicate(copy, { live: true }), replicate(other, { live: true }), {
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
