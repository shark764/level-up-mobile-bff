const { releaseItBaseConfig } = require('@level-up/utilities');

releaseItBaseConfig.npm.publish = false;
releaseItBaseConfig.gitlab.release = false;
delete releaseItBaseConfig.hooks['after:bump'];

module.exports = releaseItBaseConfig;
