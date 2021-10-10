# mt-auth

A package for building auth module which syncs with redis. The package should be used in backend to build the authenticatio flow with OTP verification.
Features provided by the packages are - 

1. Create redis instance
2. Generate JWT token
3. Decode and verify JWT token
4. Generate OTP
5. Verify OTP token
6. Generate Session, Access & Refresh token

## Usage - 

```bash 
  npm i mt-auth
```

```js
   
   const {Auth, Redis} = require('mt-auth')
   
   const redis = new Redis(....)
   const auth = new Auth(...)
```

### REDIS -

`Parameters -` 

| Params | Type   | Des          |
|--------|--------|--------------|
| host   | str    | Redis host   |
| port   | number | redis port   |
| family | str    | redis family |
| db     | str    | redis db url |


`Get Redis instance`
```js
  const redis = new Redis(host, port, family, db)
  const redisClient = redis.getInstance();
```

### Auth - 

`Parameters -`

| Params       | Type           | Des                                     |
|--------------|----------------|-----------------------------------------|
| redisClient  | redis instance | Redis instance created from redis class |
| secret       | str            | App Secret                              |
| isProduction | bool           | pass true if app in production          |

`Methods - `

```js
  const auth = new Auth(redisClient, secret, false)
  
  // GENERATE JWT TOKEN
  const token = auth.generateJwtToken(payload, expireAt)
  
  // DECODE TOKEN
  const {isValid, data} = auth.decodeJwtToken(token)
  
  // Create Auth Tokens 
  const {accessToken, refreshToken, sessionId} = auth.createAuthTokens(payload, accessTokenExpiry, sessionIdExpiry)
  
  // Refresh AccessToken 
  const {accessToken} = auth.refreshAccessToken(sessionId, accessToken, accessTokenExpiry)
  
  // Generate OTP
  const {privateKey, verifyId, otpCode} = auth.generateOTP(payload, otpType, otpExpiry, searchStr)
  
  // VERIFY OTP
  const {data} = auth.verifyOtp(searchToken, delToken ) // delToken Defaults to true
  
 ```
