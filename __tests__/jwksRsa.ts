import { verify } from 'jsonwebtoken'
import jwksClient, { CertSigningKey, RsaSigningKey } from 'jwks-rsa'
import test from 'tape'
import createAuth0Mock from '../index'

test('Tests for JWKS being correctly consumed by jwks-rsa client', (t) => {
  const auth0Mock = createAuth0Mock('https://hardfork.eu.auth0.com')
  t.test(
    'should get the correct key from the jwks endpoint',
    async (assert) => {
      assert.plan(1)
      auth0Mock.start()
      const client = jwksClient({
        jwksUri: 'https://hardfork.eu.auth0.com/.well-known/jwks.json',
        strictSsl: true, // Default value
      })

      const kid = auth0Mock.kid()
      client.getSigningKey(kid, (err) => {
        auth0Mock.stop()
        if (err) {
          return assert.fail()
        }
        assert.pass()
      })
    }
  )
  t.test(
    'should verify a token with the public key from the JWKS',
    (assert) => {
      assert.plan(1)
      auth0Mock.start()
      const client = jwksClient({
        jwksUri: 'https://hardfork.eu.auth0.com/.well-known/jwks.json',
        strictSsl: true, // Default value
      })

      const kid = auth0Mock.kid()
      client.getSigningKey(kid, (err, key) => {
        if (err) {
          auth0Mock.stop()
          return assert.fail()
        }
        const signingKey = String((key as CertSigningKey).publicKey || (key as RsaSigningKey).rsaPublicKey)
        try {
          verify(auth0Mock.token({}), signingKey)
        } catch (err) {
          auth0Mock.stop()
          return assert.fail()
        }
        auth0Mock.stop()
        assert.pass()
      })
    }
  )
})
