const xsalsa20 = require('xsalsa20')

const NONCE_BYTES = 24
const KEY_BYTES = 32

function createHook(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting options to be an object.')
  }

  // make copy of opts because we'll modify the
  // nonce and key in place if they are strings
  opts =  Object.assign({}, opts)

  if ('string' === typeof opts.nonce) {
    opts.nonce = Buffer.from(opts.nonce, 'hex')
  }

  if ('string' === typeof opts.key) {
    opts.key = Buffer.from(opts.key, 'hex')
  }

  if (opts.nonce && !Buffer.isBuffer(opts.nonce)) {
    throw new TypeError('Expecting given nonce to be a buffer.')
  }

  return onwrite

  function onwrite(index, data, peer, done) {
    const feed = this

    // The caller could call `feed.append()` before the feed is ready
    // which calls this hook synchronously
    feed.ready(() => {
      // This hook should only handle 'readable' feeds that are
      // replicating with a peer.
      // The hook can only handle buffers as the 'xsalsa20' will
      // update the buffer in place
      if (feed.writable || !peer || !Buffer.isBuffer(data)) {
        done(null)
      } else {
        // We use the feed's public key as a nonce if one is not given
        const nonce = Buffer.from(opts.nonce || feed.key).slice(0, NONCE_BYTES)
        const key = Buffer.from(opts.key).slice(0, KEY_BYTES)
        const xor = xsalsa20(nonce, key)
        xor.update(data, data)
        done(null)
      }
    })
  }
}

module.exports = Object.assign(createHook, {
  NONCE_BYTES,
  KEY_BYTES,
})
