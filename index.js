const redis = require("ioredis");
const jwt = require("jsonwebtoken");
const { customAlphabet } = require("nanoid");

const numbers = "0123456789";

const alphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const uuid16 = customAlphabet(alphabet, 16);
const randNum = customAlphabet(numbers, 6);

class Redis {
  constructor(redisHost, redisPort, redisFamily, redisDb) {
    this.redisClient = new redis({
      host: redisHost,
      port: redisPort,
      family: redisFamily,
      db: redisDb,
    });

    this.redisClient.on("error", function (err) {
      throw err;
    });
    this.redisClient.on("connect", function () {
      console.log("Connected to redis db");
    });
    this.redisClient.on("ready", async function () {
      console.log("Redis instance is ready");
    });
  }

  // RETURNS REDIS INSTANCE
  getInstance() {
    return this.redisClient;
  }
}

class Auth {
  constructor(redisClient, secret, isProduction) {
    this.redis = redisClient;
    this.secret = secret;
    this.isProduction = isProduction;
  }

  //   GENERATE JWT TOKEN
  generateJwtToken(payload, expireAt) {
    return jwt.sign(payload, this.secret, { expiresIn: expireAt });
  }

  // DECODE TOKEN
  decodeJwtToken(token) {
    try {
      const decodedData = jwt.verify(token, this.secret);
      return {
        isValid: true,
        data: decodedData,
      };
    } catch (error) {
      throw error;
    }
  }

  createAuthTokens(payload, accessTokenExpiry, sessionIdExpiry) {
    const accessToken = this.generateJwtToken(payload, accessTokenExpiry);
    const refreshToken = uuid16();
    const sessionId = `user-session-${refreshToken}`;

    this.redis.set(sessionId, accessToken);
    this.redis.expireat(sessionId, sessionIdExpiry);

    return {
      accessToken,
      refreshToken,
      sessionId,
    };
  }

  async refreshAccessToken(sessionId, accessToken, accessTokenExpiry) {
    try {
      const savedToken = await this.redis.get(sessionId);

      if (!savedToken) {
        throw new Error("token not saved");
      }

      if (savedToken !== accessToken) {
        throw new Error("token invalid");
      }

      const { isValid } = this.decodeJwtToken(savedToken);

      if (isValid) {
        throw new Error("token still valid");
      }

      const payload = jwt.verify(savedToken, this.secret, {
        ignoreExpiration: true,
      });

      // eslint-disable-next-line no-unused-vars
      const { iat, exp, ...newPayload } = payload;
      const newToken = this.generateAuthToken(newPayload, accessTokenExpiry);

      redisClient.set(sessionId, newToken);

      return {
        accessToken: newToken,
      };
    } catch (err) {
      throw err;
    }
  }

  //   VERIFY OTP
  async verifyOtp(searchToken, delToken = true) {
    try {
      const verifyToken = await this.redis.get(searchToken);
      if (!verifyToken) {
        throw new Error("Invalid OTP");
      }

      const { isValid, data } = this.decodeJwtToken(verifyToken);

      if (!isValid) {
        throw new Error("OTP expired");
      }
      if (delToken) {
        await this.redis.del(searchToken);
      }

      return {
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  //   GENERATE OTP
  generateOTP(paylaod, otpType, otpExpiry, searchStr) {
    const otpCode = this.isProduction ? randNum() : 999999;
    const privateKey = randNum();

    const verifyId = `${searchStr}-${otpType}-${otpCode}-${privateKey}`;

    const verifyToken = this.generateJwtToken(paylaod, otpExpiry);
    const expiryTime = Math.floor(Date.now() / 1000) + 3 * 60;
    this.redis.set(verifyId, verifyToken);
    this.redis.expireat(verifyId, expiryTime);
    return privateKey;
  }
}

module.exports = {
  Auth: Auth,
  Redis: Redis,
};
