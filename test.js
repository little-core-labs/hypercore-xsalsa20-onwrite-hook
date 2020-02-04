const replicate = require('hypercore-replicate')
const hypercore = require('hypercore')
const crypto = require('hypercore-crypto')
const ready = require('hypercore-ready')
const test = require('tape')
const ram = require('random-access-memory')

const hook = require('./')

test('createHook(key)', (t) => {
  const key = crypto.randomBytes(32)
  const message = Buffer.from('hello')
  const onwrite = hook(key)
  const feed = hypercore(ram, { onwrite })
  feed.ready(() => {
    // use `Buffer.from()` to make copy as `feed.append()`
    // will modify `buffer` in place
    feed.append(Buffer.from(message), (err) => {
      const onwrite = hook(key) // shadow
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
})
