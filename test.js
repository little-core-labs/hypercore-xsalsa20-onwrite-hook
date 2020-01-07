const replicate = require('hypercore-replicate')
const hypercore = require('hypercore')
const crypto = require('hypercore-crypto')
const ready = require('hypercore-ready')
const test = require('tape')
const ram = require('random-access-memory')

const hook = require('./')

function createHookTest(storage, key) {
  return (t) => {
    const message = Buffer.from('hello')
    const onwrite = hook(storage, key)
    const feed = hypercore(ram, { onwrite })
    feed.ready(() => {
      // use `Buffer.from()` to make copy as `feed.append()`
      // will modify `buffer` in place
      feed.append(Buffer.from(message), (err) => {
        const onwrite = hook(storage, key) // shadow
        const authenticated = hypercore(ram, feed.key, { onwrite })
        const unauthenticated = hypercore(ram, feed.key)
        ready(authenticated, unauthenticated, () => {
          replicate(feed, authenticated, unauthenticated, (err) => {
            authenticated.head((err, buf) => {
              t.ok(0 === Buffer.compare(buf, message), 'authenticated message')

              unauthenticated.head((err, buf) => {
                t.ok(0 !== Buffer.compare(buf, message), 'unauthenticated message')
                t.end()
              })
            })
          })
        })
      })
    })
  }
}

test('createHook(createStorage, key)', (t) => {
  const storage = ram()
  const key = crypto.randomBytes(32)
  createHookTest(storage, key)(t)
})

test('createHook(createStorage, key) - storage factory', (t) => {
  const storage = ram()
  const key = crypto.randomBytes(32).toString('hex')
  createHookTest(factory, key)(t)
  function factory(opts, k) {
    t.ok('object' === typeof opts)
    t.ok(0 === Buffer.compare(
      Buffer.from(k, 'hex'),
      Buffer.from(key, 'hex')))
    return storage
  }
})
