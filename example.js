const { keyPair } = require('hypercore-crypto')
const replicate = require('hypercore-replicate')
const hypercore = require('hypercore')
const xsalsa20 = require('xsalsa20-encoding')
const crypto = require('crypto')
const hook = require('./')
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
