const mongoose              = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const { Schema }            = mongoose;

const UserSchema = new Schema({
  email: {
    type:     String,
    required: true,
    unique:   true,
    lowercase: true,
    trim:     true,
  },
  fullName: { type: String, trim: true },
  phone:    { type: String, trim: true },
  address: {
    line1:   String,
    city:    String,
    state:   String,
    pincode: String,
  },
  isAdmin:     { type: Boolean, default: false },
  wishlist:    [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  createdAt:   { type: Date, default: Date.now },
});

UserSchema.plugin(passportLocalMongoose);   // adds username, hash, salt + methods

module.exports = mongoose.model('User', UserSchema);
