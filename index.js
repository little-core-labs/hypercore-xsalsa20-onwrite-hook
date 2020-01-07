const xsalsa20 = require('xsalsa20-encoding')
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
 * xsalsa20 cipher to encipher or decipher blocks in a Hypercore feed. Blocks
 * that are written to a Hypercore feed are encrypted detached from the
 * nonce used for encryption. Nonces are written to a user supplied
 * "nonce storage" which can be reused for deciphering blocks appended
 * to a Hypercore feed.
 *
 * This function preserves block sizes but requires an external storage
 * for nonces. Users should provide a `random-access-storage` compliant
 * instance or a factory function that returns one.
 * @param {Function<Object,Buffer>} createStorage
 * @param {String|Buffer} key
 * @param {?(Object)} opts
 * @return {Function}
 */
function createHook(createStorage, key, opts) {
  if ('string' === typeof key) {
    key = Buffer.from(key, 'hex')
  }

  opts = Object.assign({}, opts)

  assert(Buffer.isBuffer(key), '`key` is not a buffer.')

  if (createStorage && 'object' !== typeof createStorage) {
    assert('function' === typeof createStorage,
      '`createStorage` is not a function.')
  }

  const storage = 'function' === typeof createStorage
    ? createStorage(opts, key)
    : createStorage

  return onwrite

  function onwrite(index, data, peer, done) {
    const offset = index * NONCE_BYTES

    if (!peer) {
      const encrypted = xsalsa20(key).encode(data)
      const nonce = encrypted.slice(0, NONCE_BYTES)
      encrypted.slice(NONCE_BYTES).copy(data)
      storage.write(offset, nonce, done)
    } else {
      storage.read(offset, NONCE_BYTES, (err, nonce) => {
        // istanbul ignore next
        if (err) { return done(err) }
        const attached = Buffer.concat([nonce, data])
        const decrypted = xsalsa20(key).decode(attached)
        decrypted.copy(data)
        done(null)
      })
    }
  }
}

/**
 * Module exports.
 */
module.exports = Object.assign(createHook, {
  NONCE_BYTES
})
