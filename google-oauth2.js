const util = require('util')
  , OAuth2Strategy = require('passport-oauth2')
  , InternalOAuthError = require('passport-oauth2').InternalOAuthError;

function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL = options.authorizationURL || 'https://accounts.google.com/o/oauth2/v2/auth';
  options.tokenURL = options.tokenURL || 'https://www.googleapis.com/oauth2/v4/token';

  OAuth2Strategy.call(this, options, verify);
  this.name = 'google';
}

util.inherits(Strategy, OAuth2Strategy);

Strategy.prototype.authenticate = function (req, options) {
  options || (options = {})

  const oldHint = options.loginHint
  options.loginHint = req.query.login_hint
  OAuth2Strategy.prototype.authenticate.call(this, req, options)
  options.loginHint = oldHint
}

Strategy.prototype.userProfile = function (accessToken, done) {
  this._oauth2.get('https://www.googleapis.com/oauth2/v3/userinfo', accessToken, function (err, body, res) {
    if (err) { return done(new InternalOAuthError('failed to fetch user profile', err)); }

    try {
      const json = JSON.parse(body);

      const profile = { provider: 'google' };
      profile.sub = json.sub;
      profile.id = json.id || json.sub;
      profile.displayName = json.name;
      profile.name = {
        givenName: json.given_name,
        familyName: json.family_name
      };
      profile.given_name = json.given_name;
      profile.family_name = json.family_name;
      if (json.birthday) profile.birthday = json.birthday;
      if (json.relationshipStatus) profile.relationship = json.relationshipStatus;
      if (json.objectType && json.objectType == 'person') {
        profile.isPerson = true;
      }
      if (json.isPlusUser) profile.isPlusUser = json.isPlusUser;
      if (json.email_verified !== undefined) {
        profile.email_verified = json.email_verified;
        profile.verified = json.email_verified;
      }
      if (json.placesLived) profile.placesLived = json.placesLived;
      if (json.language) profile.language = json.language;
      if (!json.language && json.locale) {
        profile.language = json.locale;
        profile.locale = json.local;
      }
      if (json.emails) {
        profile.emails = json.emails;

        profile.emails.some(function (email) {
          if (email.type === 'account') {
            profile.email = email.value
            return true
          }
        })
      }
      if (!profile.email && json.email) {
        profile.email = json.email;
      }
      if (!profile.emails && profile.email) {
        profile.emails = [{
          value: profile.email,
          type: "account"
        }];
      }
      if (json.gender) profile.gender = json.gender;
      if (!json.domain && json.hd) json.domain = json.hd;
      if (json.image && json.image.url) {
        const photo = {
          value: json.image.url
        };
        if (json.image.isDefault) photo.type = 'default';
        profile.photos = [photo];
      }
      if (!json.image && json.picture) {
        const photo = {
          value: json.picture
        };
        photo.type = 'default';
        profile.photos = [photo];
        profile.picture = json.picture;
      }
      if (json.cover && json.cover.coverPhoto && json.cover.coverPhoto.url)
        profile.coverPhoto = json.cover.coverPhoto.url;

      profile._raw = body;
      profile._json = json;

      done(null, profile);
    } catch (e) {
      done(e);
    }
  });
};

Strategy.prototype.authorizationParams = function (options) {
  const params = {};
  if (options.accessType) {
    params['access_type'] = options.accessType;
  }
  if (options.approvalPrompt) {
    params['approval_prompt'] = options.approvalPrompt;
  }
  if (options.prompt) {
    params['prompt'] = options.prompt;
  }
  if (options.loginHint) {
    params['login_hint'] = options.loginHint;
  }
  if (options.userID) {
    params['user_id'] = options.userID;
  }
  if (options.hostedDomain || options.hd) {
    params['hd'] = options.hostedDomain || options.hd;
  }
  return params;
};

exports = module.exports = Strategy;
exports.Strategy = Strategy;
