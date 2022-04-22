const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let bcrypt = require('bcrypt'),
    SALT_WORK_FACTOR = 10

const adminAccountSchema = new Schema ( {
    username : {
        type: String,
        required: true,
        index: { unique: true }
    },
    password: {
        type: String,
        required: true
    },
    }
)

adminAccountSchema.pre('save', function(next) {
    var acc = this;

    // only hash the password if it has been modified (or is new)
    if (!acc.isModified('password')) return next();

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        // hash the password using our new salt
        bcrypt.hash(acc.password, salt, function(err, hash) {
            if (err) return next(err);
            // override the cleartext password with the hashed one
            acc.password = hash;
            next();
        });
    });
});
     
adminAccountSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};
     

 const AdminAccountModel = mongoose.model('AdminAccount', adminAccountSchema);

 module.exports = AdminAccountModel