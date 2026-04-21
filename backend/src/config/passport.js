import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import crypto from 'crypto';
import User from '../models/user.model.js';

const randomPassword = () => crypto.randomBytes(24).toString('hex');

export function configurePassport() {
  // Serialize/deserialize are required when using sessions.
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id).select('-password');
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: '/api/auth/google/callback',
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile?.emails?.[0]?.value?.toLowerCase() || null;
            const googleId = profile.id;

            let user = await User.findOne({ googleId });
            if (!user && email) {
              user = await User.findOne({ email });
            }

            if (!user) {
              user = await User.create({
                googleId,
                email: email || `google_${googleId}@example.local`,
                name: profile.displayName || 'Google User',
                firstName: profile?.name?.givenName || '',
                lastName: profile?.name?.familyName || '',
                phone: '0000000000',
                password: randomPassword(),
                role: 'customer',
                isVerified: true,
              });
            } else if (!user.googleId) {
              user.googleId = googleId;
              if (!user.firstName && profile?.name?.givenName) user.firstName = profile.name.givenName;
              if (!user.lastName && profile?.name?.familyName) user.lastName = profile.name.familyName;
              await user.save();
            }

            return done(null, user);
          } catch (err) {
            return done(err);
          }
        }
      )
    );
  }

  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: '/api/auth/facebook/callback',
          profileFields: ['id', 'displayName', 'emails', 'name'],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile?.emails?.[0]?.value?.toLowerCase() || null;
            const facebookId = profile.id;

            let user = await User.findOne({ facebookId });
            if (!user && email) {
              user = await User.findOne({ email });
            }

            if (!user) {
              user = await User.create({
                facebookId,
                email: email || `facebook_${facebookId}@example.local`,
                name: profile.displayName || 'Facebook User',
                firstName: profile?.name?.givenName || '',
                lastName: profile?.name?.familyName || '',
                phone: '0000000000',
                password: randomPassword(),
                role: 'customer',
                isVerified: true,
              });
            } else if (!user.facebookId) {
              user.facebookId = facebookId;
              if (!user.firstName && profile?.name?.givenName) user.firstName = profile.name.givenName;
              if (!user.lastName && profile?.name?.familyName) user.lastName = profile.name.familyName;
              await user.save();
            }

            return done(null, user);
          } catch (err) {
            return done(err);
          }
        }
      )
    );
  }

  return passport;
}

