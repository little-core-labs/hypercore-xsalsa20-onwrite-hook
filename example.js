const replicate = require('hypercore-replicate')
const hypercore = require('hypercore')
const crypto = require('hypercore-crypto')
const hook = require('./')
const ram = require('random-access-memory')

const key = crypto.randomBytes(32)

const { publicKey, secretKey } = crypto.keyPair()
const nonces = ram()

const feed = hypercore(ram, publicKey, {
  secretKey,
  onwrite: hook(nonces, key)
})

const copy = hypercore(ram, publicKey, {
  onwrite: hook(nonces, key)
})

feed.append(Buffer.from('hello'), (err) => {
  feed.head(console.log) // ciphertext
})

replicate(feed, copy, (err) => {
  if (err) throw err
  copy.head(console.log) // plaintext
})
