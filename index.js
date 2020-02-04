const xsalsa20 = require('xsalsa20-encoding')
const varint = require('varint')
const crypto = require('hypercore-crypto')
const assert = require('assert')

/**
 * The size in bytes of the nonce attached to an
 * enciphered buffer returned from the xsalsa20
 * encoding.
 * @public
 * @const
 */
const NONCE_BYTES = 24

/**
 * Creates a `onwrite()` hook for a Hypercore feed that uses the
 * xsalsa20 cipher to encipher or decipher blocks in a Hypercore feed.
 * Nonces are computed from the Hypercore feed's public key and block index.
 * @param {String|Buffer} key
 * @return {Function}
 */
function createHook(key, opts) {
  // istanbul ignore next
  if ('string' === typeof key) {
    key = Buffer.from(key, 'hex')
  }

  assert(Buffer.isBuffer(key), '`key` is not a buffer.')

  return onwrite

  function onwrite(index, data, peer, done) {
    const block = Buffer.from(varint.encode(index))
    const nonce = Buffer.allocUnsafe(24)

    // nonce = hash(key || block)
    crypto.data(Buffer.concat([this.key, block])).copy(nonce)

    // if not replicating from a peer, encipher plaintext,
    // otherwise decipher ciphertext with computed nonce
    if (!peer) {
      xsalsa20(key, { nonce: () => nonce })
        .encode(data)
        .slice(NONCE_BYTES)
        .copy(data)
    } else {
      xsalsa20(key)
        .decode(Buffer.concat([nonce, data]))
        .copy(data)
    }

    done(null)
  }
}

/**
 * Module exports.
 */
module.exports = createHook
