'use strict';

module.exports = function(Profile) {
    Profile.validatesUniquenessOf('code_name');
};
