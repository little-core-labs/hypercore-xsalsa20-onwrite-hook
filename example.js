const replicate = require('hypercore-replicate')
const hypercore = require('hypercore')
const crypto = require('hypercore-crypto')
const File = require('hypercore-indexed-file')
const pump = require('pump')
const hook = require('./')
const ram = require('random-access-memory')

const key = crypto.randomBytes(32)

const { publicKey, secretKey } = crypto.keyPair()
const nonces = ram()

const source = File(__filename, {
  key: publicKey,
  secretKey,
}, (err) => {

  const cipher = hypercore(ram, publicKey, {
    secretKey,
    onwrite: hook(nonces, key)
  })

  const edge = hypercore(ram, publicKey)

  const reader = hypercore(ram, publicKey, {
    onwrite: hook(nonces, key)
  })

  source.ready(() => {
    source.head(console.log) // plaintext

    // load cipher hypercore
    pump(source.createReadStream(), cipher.createWriteStream(), (err) => {
      if (err) throw err
      cipher.head(console.log) // ciphertext

      replicate(cipher, edge, (err) => {
        if (err) throw err
        edge.head(console.log) // ciphertext

        replicate(edge, reader, (err) => {
          if (err) throw err
          reader.head(console.log) // plaintext
          reader.createReadStream().pipe(process.stdout)
        })
      })
    })
  })
})
